import type { School } from '@/interface/energy';
import { getOutputAt, getTrend, HOURLY_OUTPUT } from './generation';
import { isProducing } from './status';
import { NOW_HOUR, TODAY } from './today';
import { REGIONS } from './regions';
import { SCHOOLS } from './schools';

/**
 * 발전소 몫으로 환산한 출력값 모음.
 *
 * `generation.ts`(도 전체 곡선) 와 `schools.ts`(발전소 목록) 를 조합하는 자리라 별도 파일로 둔다 —
 * generation 쪽에 넣으면 schools 를 거꾸로 참조해 순환이 생긴다.
 * 새 난수를 만들지 않고 기존 결정론 데이터만 나눠 쓴다.
 */

/** 도 전체 설비용량 합 — 몫을 나누는 분모 */
const REGION_CAPACITY_KW = REGIONS.reduce((sum, region) => sum + region.capacityKw, 0);

/** 도 전체 시간대별 출력 합 — 곡선 모양만 빌려 쓸 때의 분모 */
const HOURLY_TOTAL_KW = HOURLY_OUTPUT.reduce((sum, point) => sum + point.kw, 0);

/** 도 전체 곡선을 발전소 몫으로 줄여 시간대별 출력을 만든다. */
export function hourlySeriesOf(school: School): number[] {
  if (HOURLY_TOTAL_KW === 0 || !isProducing(school.status)) return HOURLY_OUTPUT.map(() => 0);

  return HOURLY_OUTPUT.map((point) => Math.round((point.kw / HOURLY_TOTAL_KW) * school.todayKwh * 10) / 10);
}

/** 지금 이 순간의 출력(kW). 도 전체 곡선에서 용량 몫만 떼어 온다. */
export function currentOutputOf(school: School): number {
  if (!isProducing(school.status)) return 0;

  return Math.round((getOutputAt(NOW_HOUR) * school.capacityKw) / REGION_CAPACITY_KW * 10) / 10;
}

/**
 * 지금 이 순간의 총출력(kW).
 * 인자를 주면 그 목록의 합(검색·필터를 건 뒤의 총합), 없으면 도 전체 곡선값을 그대로 쓴다.
 */
export function liveTotalOutput(schools?: School[]): number {
  if (!schools) return Math.round(getOutputAt(NOW_HOUR) * 10) / 10;

  return Math.round(schools.reduce((sum, school) => sum + currentOutputOf(school), 0) * 10) / 10;
}

export interface DayComparison {
  today: number;
  previous: number;
  /** 전일 대비 증감률. 전일이 0 이면 0 */
  deltaRatio: number;
}

/**
 * 금일 발전량과 전일 대비 증감 (SFR-004-07).
 * 일별 추이의 `previous` 가 이미 전일 비교값이라 그대로 쓴다.
 */
export function todayVsYesterday(): DayComparison {
  const trend = getTrend('day', TODAY.toDate());
  const point = trend[TODAY.date() - 1] ?? trend[trend.length - 1];

  if (!point) return { today: 0, previous: 0, deltaRatio: 0 };

  return {
    today: point.generation,
    previous: point.previous,
    deltaRatio: point.previous > 0 ? point.generation / point.previous - 1 : 0,
  };
}

/** 지금 발전 중인 설비 비율(0~1). 운영 지표 카드에서 쓴다. */
export function runningRatio(schools: School[] = SCHOOLS): number {
  if (schools.length === 0) return 0;

  return schools.filter((school) => isProducing(school.status)).length / schools.length;
}
