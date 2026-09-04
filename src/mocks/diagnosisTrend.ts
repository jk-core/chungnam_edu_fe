import dayjs from 'dayjs';
import type { DiagnosisFaultCode } from '@/interface/equipment';
import { getNode } from './tree';
import { getPredictionSeries } from './prediction';
import { getDayWeather } from './weather';

/** 인버터 계측 한 시점 — 전력·전압·전류를 한 자리에서 본다 (SFR-013-09, SFR-014-01/10) */
export interface DiagTrendPoint {
  /** YYYY-MM-DD HH:mm */
  time: string;
  date: string;
  powerKw: number;
  expectedPowerKw: number;
  voltage: number;
  expectedVoltage: number;
  current: number;
  expectedCurrent: number;
  irradianceWm2: number;
  faultCode: DiagnosisFaultCode;
}

export type TrendMetric = 'power' | 'voltage' | 'current';

export const TREND_META: Record<TrendMetric, { label: string; unit: string; digits: number }> = {
  power: { label: '전력', unit: 'kW', digits: 1 },
  voltage: { label: '전압', unit: 'V', digits: 1 },
  current: { label: '전류', unit: 'A', digits: 1 },
};

/** 측정값과 기대값을 한 쌍으로 꺼낸다. 차트가 지표를 갈아 끼울 때 쓴다. */
export function readTrend(point: DiagTrendPoint, metric: TrendMetric): { measured: number; expected: number } {
  if (metric === 'voltage') return { measured: point.voltage, expected: point.expectedVoltage };
  if (metric === 'current') return { measured: point.current, expected: point.expectedCurrent };

  return { measured: point.powerKw, expected: point.expectedPowerKw };
}

const trendCache = new Map<string, DiagTrendPoint[]>();

/**
 * 인버터 한 대 또는 스트링 한 조의 기간별 계측 추이 (SFR-013-09).
 *
 * 하루치 예측·실측(정시 전압·전류)을 날마다 이어 붙이고, 전력은 그 둘을 곱해 만든다.
 * 일사량은 발전이 왜 오르내렸는지 답하는 값이라 같은 그림에 겹칠 수 있게 함께 담는다.
 *
 * 스트링도 같은 셈을 쓴다 — 계측 축이 인버터와 같고, 조회 대상이 어느 계층이든 그 자신의
 * 상태로 실측이 깎인다.
 */
export function getUnitTrend(unitId: string, start: Date, end: Date): DiagTrendPoint[] {
  const key = `${unitId}-${dayjs(start).format('YYYYMMDD')}-${dayjs(end).format('YYYYMMDD')}`;
  const cached = trendCache.get(key);

  if (cached) return cached;

  const plantId = getNode(unitId)?.plantId ?? null;
  const days = Math.max(1, dayjs(end).diff(dayjs(start), 'day') + 1);
  const points: DiagTrendPoint[] = [];

  for (let index = 0; index < days; index += 1) {
    const day = dayjs(start).add(index, 'day');
    const date = day.format('YYYY-MM-DD');
    const hourly = getPredictionSeries(unitId, day.toDate());
    const weather = getDayWeather(plantId, day.toDate());
    // 그 날 예측 전류가 가장 큰 시각을 정오로 보고 일사량 곡선을 같은 모양으로 깐다.
    const peakCurrent = Math.max(...hourly.map((point) => point.predCurrent), 1);

    hourly.forEach((point) => {
      const shape = point.predCurrent / peakCurrent;

      points.push({
        time: `${date} ${point.time}`,
        date,
        // 전력(kW) = 전압 × 전류 ÷ 1000
        powerKw: Math.round((point.actualVoltage * point.actualCurrent) / 100) / 10,
        expectedPowerKw: Math.round((point.predVoltage * point.predCurrent) / 100) / 10,
        voltage: point.actualVoltage,
        expectedVoltage: point.predVoltage,
        current: point.actualCurrent,
        expectedCurrent: point.predCurrent,
        irradianceWm2: Math.round(weather.irradianceWm2 * shape),
        faultCode: point.faultCode,
      });
    });
  }

  trendCache.set(key, points);

  return points;
}
