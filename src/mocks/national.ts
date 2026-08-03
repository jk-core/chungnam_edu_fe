import { createRandom, hashSeed, pickNumber } from './random';

/**
 * 전국 지역별 평균 발전시간 (SFR-006-03/04).
 * 실제로는 한국에너지공단 REMS API 를 붙여 지역별 설비 데이터를 받아 평균을 낸다.
 *
 * 지도가 도(道) 단위 경계로 그려져 있어 광역시는 소속 도에 합쳐 집계한다.
 * 예를 들어 대전·세종은 충청권, 광주는 전라남도에 포함된 값으로 본다.
 */
export interface NationalRegion {
  /** 지도 컴포넌트 키 */
  code: string;
  name: string;
  /** 평균 발전시간(h/일) */
  avgGenerationHours: number;
  capacityMw: number;
  /** 이 도에 묶인 광역시 */
  metros: string[];
}

const SEEDS: { code: string; name: string; base: number; capacity: number; metros: string[] }[] = [
  { code: 'gyeonggi', name: '경기도', base: 3.48, capacity: 2940, metros: ['서울', '인천'] },
  { code: 'gangwon', name: '강원도', base: 3.68, capacity: 1180, metros: [] },
  { code: 'chungbuk', name: '충청북도', base: 3.74, capacity: 1830, metros: [] },
  { code: 'chungnam', name: '충청남도', base: 3.86, capacity: 2880, metros: ['대전', '세종'] },
  { code: 'jeonbuk', name: '전라북도', base: 3.94, capacity: 2510, metros: [] },
  { code: 'jeonnam', name: '전라남도', base: 4.12, capacity: 4590, metros: ['광주'] },
  { code: 'gyeongbuk', name: '경상북도', base: 3.82, capacity: 3420, metros: ['대구'] },
  { code: 'gyeongnam', name: '경상남도', base: 3.96, capacity: 3080, metros: ['부산', '울산'] },
  { code: 'jeju', name: '제주도', base: 4.05, capacity: 640, metros: [] },
];

/** REMS 에서 받아 온 것처럼, 기준값에 잔잔한 편차를 얹는다. */
export const NATIONAL_REGIONS: NationalRegion[] = SEEDS.map((seed) => {
  const next = createRandom(hashSeed(`rems-${seed.code}`));

  return {
    code: seed.code,
    name: seed.name,
    avgGenerationHours: Math.round((seed.base + pickNumber(next, -0.09, 0.09, 3)) * 100) / 100,
    capacityMw: seed.capacity,
    metros: seed.metros,
  };
});

const sorted = [...NATIONAL_REGIONS].sort((a, b) => b.avgGenerationHours - a.avgGenerationHours);

export const NATIONAL_MAX = sorted[0].avgGenerationHours;
export const NATIONAL_MIN = sorted[sorted.length - 1].avgGenerationHours;

export const NATIONAL_AVERAGE =
  Math.round((NATIONAL_REGIONS.reduce((sum, item) => sum + item.avgGenerationHours, 0) / NATIONAL_REGIONS.length) * 100)
  / 100;

/** 발전시간 높은 순 */
export function getNationalRanking(): NationalRegion[] {
  return sorted;
}

export function getNationalRank(code: string): number {
  return sorted.findIndex((item) => item.code === code) + 1;
}

export const getNationalRegion = (code: string) => NATIONAL_REGIONS.find((item) => item.code === code) ?? null;
