import dayjs from 'dayjs';
import type { DiagEfficiencyPoint, ModelMetrics, PredictionPoint } from '@/interface/diagnosisDetail';
import type { OperationStatus } from '@/interface/status';
import { NORMAL_BAND } from '@/configs/diagnosis';
import { getNode } from './tree';
import { FAULT_BY_STATUS } from './faultCodes';
import { SUNRISE_HOUR, SUNSET_HOUR } from './generation';
import { createRandom, hashSeed, pickNumber } from './random';
import { isProducing } from './status';

/**
 * 물리 모델 + AI 예측 성능 (SFR-014-05, SFR-011-06/07).
 * 요구 기준(R² 0.94 이상, 고장 분류 정확도 94% 이상)을 넘는 값으로 둔다.
 */
export const MODEL_METRICS: ModelMetrics = {
  voltageR2: 0.962,
  currentR2: 0.948,
  faultAccuracy: 0.951,
  trainRatio: 0.8,
  sampleCount: 184_320,
};

export const MODEL_NOTE = '전압 Bagging Tree · 전류 Linear Regression · 고장분류 KNN (학습 80% / 검증 20%)';

const predictionCache = new Map<string, PredictionPoint[]>();

/**
 * 정시 기준 DC 전압·전류 예측값과 실측값 (SFR-014-01/10).
 * 물리식으로 기대값을 만들고 실측은 설비 상태만큼 깎아 붙인다.
 */
export function getPredictionSeries(unitId: string, date: Date): PredictionPoint[] {
  const ymd = dayjs(date).format('YYYY-MM-DD');
  const key = `${unitId}-${ymd}-pred`;
  const cached = predictionCache.get(key);

  if (cached) return cached;

  // 인버터와 스트링이 같은 셈을 쓴다 — 상태는 계층 노드가 알고 있어 둘 다 여기서 읽힌다.
  const status: OperationStatus = getNode(unitId)?.status ?? 'running';
  const next = createRandom(hashSeed(key));
  // 상태가 나쁘면 실측이 예측보다 이만큼 낮게 나온다.
  const lossBase = status === 'fault' ? 0.46 : status === 'degraded' ? 0.78 : 1;
  const candidates = FAULT_BY_STATUS[status];
  const faultCode = candidates.length > 0 ? candidates[0] : 0;

  const points: PredictionPoint[] = [];

  for (let hour = Math.floor(SUNRISE_HOUR); hour <= Math.ceil(SUNSET_HOUR); hour += 1) {
    const bell = Math.exp(-(((hour - 12.7) / 3.35) ** 2));
    // 전압은 일사에 덜 민감하고, 전류가 일사에 거의 비례한다.
    const predVoltage = Math.round((610 + bell * 120) * 10) / 10;
    const predCurrent = Math.round(bell * 62 * 10) / 10;
    const live = isProducing(status);
    const jitter = () => pickNumber(next, 0.97, 1.03, 3);

    const actualVoltage = live ? Math.round(predVoltage * (0.94 + lossBase * 0.06) * jitter() * 10) / 10 : 0;
    const actualCurrent = live ? Math.round(predCurrent * lossBase * jitter() * 10) / 10 : 0;
    const ratio = predCurrent > 0 ? Math.round((actualCurrent / predCurrent) * 1000) / 1000 : 0;

    points.push({
      time: `${String(hour).padStart(2, '0')}:00`,
      actualVoltage,
      predVoltage,
      actualCurrent,
      predCurrent,
      ratio,
      deviation: Math.round((ratio - 1) * 1000) / 10,
      faultCode: ratio >= 0.9 ? 0 : faultCode,
    });
  }

  predictionCache.set(key, points);

  return points;
}

const efficiencyCache = new Map<string, DiagEfficiencyPoint[]>();

/**
 * 기간 안의 일자별 진단 효율과 추정·측정 발전량 (SFR-013-02/07).
 * 그래프에는 효율을, 툴팁에는 추정값·측정값·편차를 함께 물린다.
 */
export function getDiagEfficiencyPoints(
  id: string,
  status: OperationStatus,
  capacityKw: number,
  start: Date,
  end: Date,
): DiagEfficiencyPoint[] {
  const key = `${id}-${dayjs(start).format('YYYYMMDD')}-${dayjs(end).format('YYYYMMDD')}-eff`;
  const cached = efficiencyCache.get(key);

  if (cached) return cached;

  const next = createRandom(hashSeed(key));
  const days = Math.max(1, dayjs(end).diff(dayjs(start), 'day') + 1);
  const base = status === 'fault' ? 46 : status === 'degraded' ? 76 : 96;
  const candidates = FAULT_BY_STATUS[status];

  const points = Array.from({ length: days }, (_, index) => {
    const date = dayjs(start).add(index, 'day');
    const live = isProducing(status);
    // 이상 설비는 기간이 갈수록 조금 더 떨어진다.
    const drift = status === 'running' ? 0 : (index / Math.max(1, days - 1)) * 6;
    const efficiency = live
      ? Math.max(0, Math.min(108, Math.round((base - drift + pickNumber(next, -3.4, 3.4, 1)) * 10) / 10))
      : 0;
    const estimateKwh = Math.round(capacityKw * pickNumber(next, 3.4, 4.9, 2));
    const measuredKwh = Math.round((estimateKwh * efficiency) / 100);

    return {
      date: date.format('YYYY-MM-DD'),
      efficiency,
      estimateKwh,
      measuredKwh,
      faultCode: efficiency >= NORMAL_BAND.min ? 0 : candidates[0] ?? 0,
    };
  });

  efficiencyCache.set(key, points);

  return points;
}
