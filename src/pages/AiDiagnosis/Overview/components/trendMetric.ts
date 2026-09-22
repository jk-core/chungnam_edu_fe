import { formatNumber } from '@/utils/format';
import type { DiagnosisRawPoint } from '@/service/diagnosis/type';

/** 추이 차트가 번갈아 그리는 계측값 */
export type TrendMetric = 'power' | 'voltage' | 'current';

export const TREND_META: Record<TrendMetric, { label: string; unit: string; digits: number }> = {
  power: { label: '전력', unit: 'kW', digits: 1 },
  voltage: { label: '전압', unit: 'V', digits: 1 },
  current: { label: '전류', unit: 'A', digits: 2 },
};

/**
 * 한 수집 시점에서 고른 계측값 한 벌.
 * 측정값·정상범위 상하한·두 예측값이 필드 이름만 갈린 채 같은 모양으로 온다.
 *
 * 잰 값이 없는 시점은 null 이다 — 차트는 그 자리에서 선을 끊고, 글자는 하이픈으로 적는다.
 */
export interface TrendReading {
  measured: number | null;
  lower: number | null;
  upper: number | null;
  /** 물리모델 예측값 */
  phys: number | null;
  /** 머신러닝 예측값 */
  ml: number | null;
}

/** 값이 없으면 하이픈 — 0 으로 적으면 안 잰 것과 구분되지 않는다 */
export function metricText(value: number | null, digits: number, unit = ''): string {
  return value === null ? '—' : `${formatNumber(value, digits)}${unit}`;
}

export function readTrend(point: DiagnosisRawPoint, metric: TrendMetric): TrendReading {
  if (metric === 'voltage') {
    return {
      measured: point.pvVlt,
      lower: point.pvVltNormalLower,
      upper: point.pvVltNormalUpper,
      phys: point.pvVltPhys,
      ml: point.pvVltMl,
    };
  }

  if (metric === 'current') {
    return {
      measured: point.pvCur,
      lower: point.pvCurNormalLower,
      upper: point.pvCurNormalUpper,
      phys: point.pvCurPhys,
      ml: point.pvCurMl,
    };
  }

  return {
    measured: point.pvPwr,
    lower: point.pvPwrNormalLower,
    upper: point.pvPwrNormalUpper,
    phys: point.pvPwrPhys,
    ml: point.pvPwrMl,
  };
}
