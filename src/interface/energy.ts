import type { OperationStatus, RtuStatus, Severity } from './status';

export type { Severity };

/**
 * 학교급. 마스터 표의 구분을 그대로 따른다 — 유치원과 교육기관(지원청·교육원·수련원)도
 * 발전설비를 가진 한 자리 차지한다.
 */
export type SchoolLevel = '유치원' | '초등학교' | '중학교' | '고등학교' | '특수학교' | '교육기관';

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
}

/** 발전설비가 설치된 학교 */
export interface School {
  id: string;
  name: string;
  regionCode: string;
  regionName: string;
  level: SchoolLevel;
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
  /** 지도 마커 좌표 — 주소를 지오코딩한 실제 위치 */
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
