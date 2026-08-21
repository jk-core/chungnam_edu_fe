import type { OperationStatus, RtuStatus, Severity } from './status';

export type { Severity };

/** 학교급 */
export type SchoolLevel = '초등학교' | '중학교' | '고등학교' | '특수학교';

/**
 * 발전소 구분 (plantType).
 *
 * 학교만 있는 것이 아니라 기관도 들어오므로 `schoolType` 이라 부르지 않는다.
 */
export type PlantType = SchoolLevel | '기관';

/** 위경도 한 점 */
export interface GeoPoint {
  lng: number;
  lat: number;
}

/** 충남 시·군 */
export interface Region {
  code: string;
  name: string;
  schoolCount: number;
  capacityKw: number;
  todayKwh: number;
  monthKwh: number;
  /** 시·군 중심 좌표 — 지도에 라벨과 발전소 마커를 놓는 기준 */
  center: GeoPoint;
}

/** 발전설비가 설치된 학교 */
export interface School {
  id: string;
  name: string;
  regionCode: string;
  regionName: string;
  level: PlantType;
  address: string;
  capacityKw: number;
  /** 설치된 인버터 수 */
  inverterCount: number;
  /** 일사량계 계측·연계 상태 */
  pyranometerStatus: RtuStatus;
  todayKwh: number;
  monthKwh: number;
  yearKwh: number;
  /** 이용률(0~1) */
  utilization: number;
  status: OperationStatus;
  installedAt: string;
  /** 지도 마커 좌표 — 시·군 중심에서 흩뿌린 값 */
  location: GeoPoint;
}

/** 태양 궤적 그래프의 시간별 출력 */
export interface HourlyOutput {
  hour: number;
  kw: number;
}

/** 발전량 추이 한 구간 */
export interface TrendPoint {
  label: string;
  generation: number;
  irradiance: number;
  previous: number;
}

/** 진단으로 검출된 이상 항목 */
export interface Issue {
  id: string;
  schoolId: string;
  schoolName: string;
  regionName: string;
  device: string;
  category: string;
  severity: Severity;
  detectedAt: string;
  /** 추정 발전 손실(kWh/일) */
  lossKwh: number;
  summary: string;
  action: string;
  /** 최근 7일 지표 추이 (스파크라인용) */
  trend: number[];
}

/** 점검 이력·예정 */
export interface Inspection {
  id: string;
  schoolId: string;
  schoolName: string;
  type: string;
  date: string;
  state: 'done' | 'scheduled' | 'overdue';
  note: string;
}
