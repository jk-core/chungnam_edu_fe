import { REGIONS } from './regions';

/*
  서버는 지역을 5자리 숫자 문자열로 다룬다. 목업은 시·군을 영문 키로 갖고 있어,
  나열 순서대로 코드를 매겨 둘을 잇는다 — 값 자체는 규격을 맞추기 위한 자리다.
*/
export const REGION_CODES = REGIONS.map((region, index) => ({
  regionCode: `44${String((index + 1) * 10).padStart(3, '0')}`,
  key: region.code,
  name: region.name,
}));

export function regionCodeOf(key: string): string {
  return REGION_CODES.find((item) => item.key === key)?.regionCode ?? REGION_CODES[0].regionCode;
}

export function regionNameOfCode(code: string): string {
  return REGION_CODES.find((item) => item.regionCode === code)?.name ?? '';
}
