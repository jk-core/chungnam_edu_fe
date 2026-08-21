import { isAbnormal } from '@/mocks/status';
import { currentOutputOf } from '@/mocks/schoolOutput';
import type { School } from '@/interface/energy';

/**
 * 집계 축 (SFR-004-03).
 * 이 시스템에서 발전소와 학교는 1:1 이라 둘을 같은 축으로 두면 같은 표가 두 번 나온다.
 * 그래서 개별 설비는 '발전소별', 학교 성격별 묶음은 '학교급별' 로 갈라 두 축을 다르게 만든다.
 */
export type Axis = 'plant' | 'level' | 'region';

export const AXIS_OPTIONS: { value: Axis; label: string }[] = [
  { value: 'plant', label: '학교별' },
  { value: 'level', label: '기관별' },
  { value: 'region', label: '지역별' },
];

export interface AggregationRow {
  key: string;
  name: string;
  /** 묶음에 속한 발전소 수 — 발전소별에서는 표시하지 않는다 */
  count: number;
  capacityKw: number;
  todayKwh: number;
  outputKw: number;
  /** 이상 설비 수 */
  abnormal: number;
  /** 발전소별에서만 채운다 */
  school: School | null;
}

export function aggregate(schools: School[], axis: Axis): AggregationRow[] {
  if (axis === 'plant') {
    return schools.map((school) => ({
      key: school.id,
      name: school.name,
      count: 1,
      capacityKw: school.capacityKw,
      todayKwh: school.todayKwh,
      outputKw: currentOutputOf(school),
      abnormal: isAbnormal(school.status) ? 1 : 0,
      school,
    }));
  }

  const buckets = new Map<string, AggregationRow>();

  schools.forEach((school) => {
    const name = axis === 'level' ? school.level : school.regionName;
    const row = buckets.get(name) ?? {
      key: name,
      name,
      count: 0,
      capacityKw: 0,
      todayKwh: 0,
      outputKw: 0,
      abnormal: 0,
      school: null,
    };

    row.count += 1;
    row.capacityKw += school.capacityKw;
    row.todayKwh += school.todayKwh;
    row.outputKw += currentOutputOf(school);
    row.abnormal += isAbnormal(school.status) ? 1 : 0;
    buckets.set(name, row);
  });

  return [...buckets.values()];
}
