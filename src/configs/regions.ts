import type { GeoPoint } from '@/interface/energy';

/**
 * 충청남도 15개 시·군.
 *
 * BE 가 내려주지 않는다 — 바뀌지 않는 행정구역이라 프론트가 갖는다.
 * 시·군을 늘리거나 줄이는 곳은 여기 하나이고, 목업·지도·Select 가 모두 이 표를 읽는다.
 */
export interface RegionConfig {
  /** 목업과 화면이 쓰는 영문 키 */
  code: string;
  name: string;
  /** 행정표준코드 시·군 코드 — BE 계약의 regionCode 자리 */
  regionCode: string;
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
  { code: 'cheonan', name: '천안시', regionCode: '44130', center: { lng: 127.114, lat: 36.815 }, office: '천안' },
  { code: 'gongju', name: '공주시', regionCode: '44150', center: { lng: 127.119, lat: 36.447 }, office: '공주' },
  { code: 'boryeong', name: '보령시', regionCode: '44180', center: { lng: 126.613, lat: 36.333 }, office: '보령' },
  { code: 'asan', name: '아산시', regionCode: '44200', center: { lng: 127.002, lat: 36.79 }, office: '아산' },
  { code: 'seosan', name: '서산시', regionCode: '44210', center: { lng: 126.45, lat: 36.785 }, office: '서산' },
  { code: 'nonsan', name: '논산시', regionCode: '44230', center: { lng: 127.099, lat: 36.187 }, office: '논산계룡' },
  { code: 'gyeryong', name: '계룡시', regionCode: '44250', center: { lng: 127.249, lat: 36.274 }, office: '논산계룡' },
  { code: 'dangjin', name: '당진시', regionCode: '44270', center: { lng: 126.646, lat: 36.89 }, office: '당진' },
  { code: 'geumsan', name: '금산군', regionCode: '44710', center: { lng: 127.452, lat: 36.132 }, office: '금산' },
  { code: 'buyeo', name: '부여군', regionCode: '44760', center: { lng: 126.91, lat: 36.276 }, office: '부여' },
  { code: 'seocheon', name: '서천군', regionCode: '44770', center: { lng: 126.692, lat: 36.08 }, office: '서천' },
  { code: 'cheongyang', name: '청양군', regionCode: '44790', center: { lng: 126.802, lat: 36.459 }, office: '청양' },
  { code: 'hongseong', name: '홍성군', regionCode: '44800', center: { lng: 126.661, lat: 36.601 }, office: '홍성' },
  { code: 'yesan', name: '예산군', regionCode: '44810', center: { lng: 126.845, lat: 36.683 }, office: '예산' },
  { code: 'taean', name: '태안군', regionCode: '44825', center: { lng: 126.298, lat: 36.746 }, office: '태안' },
];

export function regionOf(code: string): RegionConfig | undefined {
  return CHUNGNAM_REGIONS.find((region) => region.code === code);
}

/** 시·군 코드로 교육지원청 이름을 찾는다. */
export function educationOfficeOf(code: string): string {
  return `${regionOf(code)?.office ?? '충청남도'}교육지원청`;
}

/** 영문 키 → 행정표준코드. 서버로 나가는 값은 언제나 이쪽이다. */
export function regionCodeOf(code: string): string {
  return regionOf(code)?.regionCode ?? CHUNGNAM_REGIONS[0].regionCode;
}

export function regionNameOfCode(regionCode: string): string {
  return CHUNGNAM_REGIONS.find((region) => region.regionCode === regionCode)?.name ?? '';
}
