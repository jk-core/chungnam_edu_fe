import { CHUNGNAM_REGIONS, educationOfficeOf } from '@/configs/regions';
import { SCHOOLS } from '@/mocks/schools';
import type { PeriodKey } from '@/mocks/generation';
import type { School } from '@/interface/energy';

/**
 * 조회 기준 (SFR-008-04).
 *
 * '설비별'은 지금 고른 발전소·인버터를 파고드는 기존 흐름이고,
 * 나머지 둘은 도 전체를 묶어 훑는 흐름이다 — 조회 대상 트리와 상관없이 전체를 센다.
 */
export type StatBasis = 'device' | 'region' | 'office';

export const BASIS_OPTIONS: { value: StatBasis; label: string }[] = [
  { value: 'device', label: '설비별' },
  { value: 'region', label: '지역별' },
  { value: 'office', label: '교육청별' },
];

export const BASIS_LABEL: Record<StatBasis, string> = {
  device: '설비',
  region: '지역',
  office: '교육지원청',
};

export interface BasisRow {
  key: string;
  name: string;
  /** 묶음에 속한 발전소 수 */
  count: number;
  capacityKw: number;
  generationKwh: number;
  /** 설비이용률 — 용량 대비 발전량 (SFR-008-02) */
  utilization: number;
}

/** 기간마다 학교가 이미 들고 있는 집계값을 골라 쓴다 — 300개소를 다시 셈하지 않는다. */
function kwhOf(school: School, period: PeriodKey): number {
  if (period === 'day') return school.todayKwh;
  if (period === 'month') return school.monthKwh;

  return school.yearKwh;
}

/** 기간에 해당하는 시간 수 — 설비이용률의 분모다. */
function hoursOf(period: PeriodKey, date: Date): number {
  if (period === 'day') return 24;
  if (period === 'month') return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() * 24;

  return 365 * 24;
}

/** 시·군 또는 교육지원청으로 도 전체를 묶는다 (SFR-008-04). */
export function aggregateByBasis(basis: StatBasis, period: PeriodKey, date: Date): BasisRow[] {
  if (basis === 'device') return [];

  const hours = hoursOf(period, date);
  const buckets = new Map<string, BasisRow>();

  SCHOOLS.forEach((school) => {
    const name = basis === 'region'
      ? school.regionName
      : educationOfficeOf(CHUNGNAM_REGIONS.find((region) => region.name === school.regionName)?.code ?? '');
    const row = buckets.get(name)
      ?? { key: name, name, count: 0, capacityKw: 0, generationKwh: 0, utilization: 0 };

    row.count += 1;
    row.capacityKw += school.capacityKw;
    row.generationKwh += kwhOf(school, period);
    buckets.set(name, row);
  });

  return [...buckets.values()]
    .map((row) => ({
      ...row,
      utilization: row.capacityKw > 0 ? row.generationKwh / (row.capacityKw * hours) : 0,
    }))
    .sort((a, b) => b.generationKwh - a.generationKwh);
}
