import type { GeoPoint } from '@/interface/energy';

/**
 * 충청남도 시·군·구.
 *
 * 코드는 행정표준코드 한 축뿐이다 — BE 가 `regionCode` 로 이 값을 내려준다.
 * 나중에 지역 드롭다운 API(`/area/list/dropdown`)로 옮기면 이 표가 그 응답 자리로 간다.
 *
 * 천안시만 자치구를 둬서 세 줄이다 — 시(44130)와 그 아래 동남구·서북구. 발전소는 구 코드로
 * 내려오므로, 시 코드는 이름을 되찾을 때만 쓰이고 목록에는 세우지 않는다.
 */
export interface RegionConfig {
  /** 행정표준코드 시·군·구 코드. 「충청남도」를 뗀 이름과 짝이다 */
  regionCode: string;
  name: string;
  /** 자치구를 둔 시의 코드. 구에만 있다 */
  parentCode?: string;
  /** 지도에 이름 라벨을 놓는 기준점 */
  center: GeoPoint;
  /**
   * 관할 교육지원청 앞말 (SFR-008-04).
   * 15개 시·군을 14개 지원청이 나눠 맡는다 — 논산시와 계룡시가 한 지원청이라
   * 「지역별」과 「교육청별」은 같은 표가 되지 않는다.
   */
  office: string;
}

export const CHUNGNAM_REGIONS: RegionConfig[] = [
  { regionCode: '44130', name: '천안시', center: { lng: 127.114, lat: 36.815 }, office: '천안' },
  { regionCode: '44131', name: '천안시 동남구', parentCode: '44130', center: { lng: 127.18, lat: 36.74 }, office: '천안' },
  { regionCode: '44133', name: '천안시 서북구', parentCode: '44130', center: { lng: 127.08, lat: 36.86 }, office: '천안' },
  { regionCode: '44150', name: '공주시', center: { lng: 127.119, lat: 36.447 }, office: '공주' },
  { regionCode: '44180', name: '보령시', center: { lng: 126.613, lat: 36.333 }, office: '보령' },
  { regionCode: '44200', name: '아산시', center: { lng: 127.002, lat: 36.79 }, office: '아산' },
  { regionCode: '44210', name: '서산시', center: { lng: 126.45, lat: 36.785 }, office: '서산' },
  { regionCode: '44230', name: '논산시', center: { lng: 127.099, lat: 36.187 }, office: '논산계룡' },
  { regionCode: '44250', name: '계룡시', center: { lng: 127.249, lat: 36.274 }, office: '논산계룡' },
  { regionCode: '44270', name: '당진시', center: { lng: 126.646, lat: 36.89 }, office: '당진' },
  { regionCode: '44710', name: '금산군', center: { lng: 127.452, lat: 36.132 }, office: '금산' },
  { regionCode: '44760', name: '부여군', center: { lng: 126.91, lat: 36.276 }, office: '부여' },
  { regionCode: '44770', name: '서천군', center: { lng: 126.692, lat: 36.08 }, office: '서천' },
  { regionCode: '44790', name: '청양군', center: { lng: 126.802, lat: 36.459 }, office: '청양' },
  { regionCode: '44800', name: '홍성군', center: { lng: 126.661, lat: 36.601 }, office: '홍성' },
  { regionCode: '44810', name: '예산군', center: { lng: 126.845, lat: 36.683 }, office: '예산' },
  { regionCode: '44825', name: '태안군', center: { lng: 126.298, lat: 36.746 }, office: '태안' },
];

/**
 * 화면에 세우는 시·군 15개 — 자치구는 시로 접는다.
 * 지역 필터·지도 라벨·지역별 집계가 이 목록을 쓴다. 천안 라벨이 셋으로 갈리면 지도가 겹친다.
 */
export const SIGUNGU_REGIONS: RegionConfig[] = CHUNGNAM_REGIONS.filter((region) => !region.parentCode);

export function regionOf(regionCode: string): RegionConfig | undefined {
  return CHUNGNAM_REGIONS.find((region) => region.regionCode === regionCode);
}

export function regionNameOfCode(regionCode: string): string {
  return regionOf(regionCode)?.name ?? '';
}

/** 자치구는 소속 시로 접는다 — 지역별 집계와 발전시간이 시 단위다 */
export function sigunguCodeOf(regionCode: string): string {
  return regionOf(regionCode)?.parentCode ?? regionCode;
}

/** 고른 지역에 그 발전소가 속하는가. 시를 고르면 그 아래 구까지 걸린다 */
export function isInRegion(regionCode: string, selected: string): boolean {
  return regionCode === selected || sigunguCodeOf(regionCode) === selected;
}

/** 시·군 코드로 교육지원청 이름을 찾는다. */
export function educationOfficeOf(regionCode: string): string {
  return `${regionOf(regionCode)?.office ?? '충청남도'}교육지원청`;
}
