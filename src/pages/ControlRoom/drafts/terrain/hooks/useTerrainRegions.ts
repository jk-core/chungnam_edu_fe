import { useMemo } from 'react';
import { CO2_PER_KWH } from '@/mocks/generation';
import { currentOutputOf } from '@/mocks/schoolOutput';
import { countOperation, isAbnormal, OPERATION_RANK } from '@/mocks/status';
import type { School } from '@/interface/energy';
import type { OperationStatus } from '@/interface/status';
import { orderRegionNames } from '@/pages/ControlRoom/utils/regionTour';
import { useTerrainTour } from './useTerrainTour';

/**
 * 한 시·군이 상세 판에 내놓는 값 전부.
 *
 * 고객이 지정한 열 항목(발전량·발전시간·설비용량·출력·이용률·설비상태·문제설비목록·
 * 누적발전량·누적발전시간·탄소저감)을 한 자리에서 모두 셈해 둔다.
 */
export interface RegionStat {
  name: string;
  schools: School[];
  count: number;
  capacityKw: number;
  todayKwh: number;
  outputKw: number;
  yearKwh: number;
  /** 금일 발전시간(h) = 금일 발전량 ÷ 설비용량. 큰 시와 작은 시를 같은 눈금에 세운다 */
  hours: number;
  /** 누적 발전시간(h) = 누적 발전량 ÷ 설비용량 */
  cumulativeHours: number;
  /** 이용률 = 개소별 이용률의 평균 (고객 지정 셈법) */
  utilization: number;
  /** 탄소저감(kg) = 누적 발전량 × 계수 */
  carbonKg: number;
  abnormal: number;
  statusCount: Record<OperationStatus, number>;
  /** 손봐야 할 설비 — 급한 순 */
  faults: School[];
  /** 개소 수 단계(1~5). 지도 단계색과 상세 색점이 같은 값을 본다 */
  scale: 1 | 2 | 3 | 4 | 5;
  /** 이 시·군 학교들의 무게중심 — 카카오 지도에서 배지가 앉는 자리 */
  centroid: { lat: number; lng: number };
}

export interface TerrainRegions {
  /** 발전소가 있는 시·군 — 순회 차례대로 */
  regions: RegionStat[];
  /** 지금 머무는 시·군 */
  active: RegionStat;
  tour: ReturnType<typeof useTerrainTour>;
  /** 시·군 면을 물들일 색. 발전소가 없으면 바탕색 */
  colorForRegion: (name: string) => string;
  /** 지도에서 이 시·군이 몇 번째 자리인지 — 없으면 -1 */
  indexOfRegion: (name: string) => number;
  /** 도 전체 합 — 지도 판의 머리에 얹는다 */
  province: { count: number; capacityKw: number; todayKwh: number; minCount: number; maxCount: number };
  /** 도 전체 무게중심 — 카카오 지도의 처음 중심 */
  provinceCenter: { lat: number; lng: number };
}

/** 빈 시·군에 쓸 자리끼우개 — 조회 조건이 좁혀져 대상이 하나도 없을 때를 막는다 */
const EMPTY: RegionStat = {
  name: '-',
  schools: [],
  count: 0,
  capacityKw: 0,
  todayKwh: 0,
  outputKw: 0,
  yearKwh: 0,
  hours: 0,
  cumulativeHours: 0,
  utilization: 0,
  carbonKg: 0,
  abnormal: 0,
  statusCount: countOperation([]),
  faults: [],
  scale: 1,
  centroid: { lat: 36.58, lng: 126.85 },
};

/**
 * 시안 B 의 지도·상세가 함께 보는 계산 한 벌.
 *
 * 지도(면 색·이름표)와 상세(수치·목록)가 같은 시·군을 같은 값으로 비춰야 한다 — 판마다 따로
 * 집계하면 같은 자리에 다른 수가 뜬다. 그래서 두 판이 이 훅 하나를 부르고, 순회 자리도
 * 모듈이 쥔 `useTerrainTour` 한 곳에서만 나온다.
 *
 * 단계색은 **개소 수의 등수** 로 매긴다. 값 폭(천안 68 ↔ 계룡 7)을 그대로 다섯 칸에 나누면
 * 큰 한둘만 진하고 나머지가 옅은 쪽에 몰려 절반이 같은 색으로 보인다. 등수로 나누면 다섯 단이
 * 고르게 벌어져 이름표 없이도 어느 단인지 세어진다.
 */
export function useTerrainRegions(plants: School[]): TerrainRegions {
  const regions = useMemo<RegionStat[]>(() => {
    const byRegion = new Map<string, School[]>();

    plants.forEach((school) => {
      const bucket = byRegion.get(school.regionName);

      if (bucket) bucket.push(school);
      else byRegion.set(school.regionName, [school]);
    });

    const order = orderRegionNames(plants);

    // 개소 수 등수를 먼저 매긴다 — 지도 전체를 보고 나눠야 다섯 단이 고르게 벌어진다.
    const counts = order
      .map((name) => (byRegion.get(name) ?? []).length)
      .sort((a, b) => a - b);
    const total = counts.length;
    const scaleOf = (count: number): RegionStat['scale'] => {
      if (total <= 1) return 3;

      const rank = counts.indexOf(count);

      return Math.min(5, Math.floor((rank / total) * 5) + 1) as RegionStat['scale'];
    };

    return order.map((name): RegionStat => {
      const schools = byRegion.get(name) ?? [];
      const capacityKw = schools.reduce((sum, s) => sum + s.capacityKw, 0);
      const todayKwh = schools.reduce((sum, s) => sum + s.todayKwh, 0);
      const yearKwh = schools.reduce((sum, s) => sum + s.yearKwh, 0);
      const outputKw = schools.reduce((sum, s) => sum + currentOutputOf(s), 0);
      const utilizationSum = schools.reduce((sum, s) => sum + s.utilization, 0);
      const centroid = schools.length > 0
        ? {
          lat: schools.reduce((sum, s) => sum + s.location.lat, 0) / schools.length,
          lng: schools.reduce((sum, s) => sum + s.location.lng, 0) / schools.length,
        }
        : { lat: 36.58, lng: 126.85 };

      return {
        name,
        schools,
        count: schools.length,
        capacityKw,
        todayKwh,
        outputKw,
        yearKwh,
        hours: capacityKw > 0 ? todayKwh / capacityKw : 0,
        cumulativeHours: capacityKw > 0 ? yearKwh / capacityKw : 0,
        utilization: schools.length > 0 ? utilizationSum / schools.length : 0,
        carbonKg: yearKwh * CO2_PER_KWH,
        abnormal: schools.filter((s) => isAbnormal(s.status)).length,
        statusCount: countOperation(schools),
        faults: schools
          .filter((s) => isAbnormal(s.status))
          .sort((a, b) => OPERATION_RANK[a.status] - OPERATION_RANK[b.status]),
        scale: scaleOf(schools.length),
        centroid,
      };
    });
  }, [plants]);

  const scaleByName = useMemo(
    () => new Map(regions.map((region) => [region.name, region.scale])),
    [regions],
  );

  const tour = useTerrainTour(regions.length);
  const active = regions[tour.index] ?? regions[0] ?? EMPTY;

  const province = useMemo(() => {
    const counts = regions.map((region) => region.count);

    return {
      count: regions.reduce((sum, region) => sum + region.count, 0),
      capacityKw: regions.reduce((sum, region) => sum + region.capacityKw, 0),
      todayKwh: regions.reduce((sum, region) => sum + region.todayKwh, 0),
      minCount: counts.length > 0 ? Math.min(...counts) : 0,
      maxCount: counts.length > 0 ? Math.max(...counts) : 0,
    };
  }, [regions]);

  // 도 전체 무게중심 — 개소 수로 가중하지 않고 시·군을 고르게 본다(빈 시·군은 빠진다)
  const provinceCenter = useMemo(() => {
    if (regions.length === 0) return { lat: 36.58, lng: 126.85 };

    return {
      lat: regions.reduce((sum, r) => sum + r.centroid.lat, 0) / regions.length,
      lng: regions.reduce((sum, r) => sum + r.centroid.lng, 0) / regions.length,
    };
  }, [regions]);

  return {
    regions,
    active,
    tour,
    colorForRegion: (name) => {
      const scale = scaleByName.get(name);

      return scale ? `var(--map-scale-${scale})` : 'var(--map-surface)';
    },
    indexOfRegion: (name) => regions.findIndex((region) => region.name === name),
    province,
    provinceCenter,
  };
}
