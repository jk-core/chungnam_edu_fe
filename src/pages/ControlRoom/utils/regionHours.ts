import { REGIONS } from '@/mocks/regions';

export interface RegionHours {
  code: string;
  name: string;
  /** 금일 발전시간(h) = 금일 발전량 ÷ 설비용량 */
  hours: number;
}

/**
 * 지역별 금일 발전시간 (SFR-004-09).
 *
 * 목록과 판 제목 줄이 같은 값을 나눠 쓴다 — 각자 셈하면 「평균 4.4h」 와 목록의 값이 어긋나는
 * 날이 온다. 평균은 지역 평균이 아니라 관내 전체 발전량을 전체 설비용량으로 나눈 값이다.
 * 지역마다 개소 수가 달라 단순 평균을 내면 계룡시(7개소)와 천안시(68개소)가 같은 무게가 된다.
 */
export function getRegionHours(): { rows: RegionHours[]; average: number; count: number } {
  const rows = REGIONS
    .map((region) => ({
      code: region.code,
      name: region.name,
      hours: region.capacityKw > 0 ? region.todayKwh / region.capacityKw : 0,
    }))
    .sort((a, b) => b.hours - a.hours);

  const capacityKw = REGIONS.reduce((sum, region) => sum + region.capacityKw, 0);
  const todayKwh = REGIONS.reduce((sum, region) => sum + region.todayKwh, 0);

  return { rows, average: capacityKw > 0 ? todayKwh / capacityKw : 0, count: rows.length };
}
