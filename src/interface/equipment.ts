import type { OperationStatus, RtuStatus, Severity } from './status';
import type { NodeKind } from './tree';

/** 인버터 아래 스트링 (또는 접속반 아래 채널) */
export interface StringUnit {
  id: string;
  name: string;
  status: OperationStatus;
  capacityKw: number;
  /** 같은 부모 안 다른 형제 대비 출력 비율 */
  relativeOutput: number;
}

/** 센트럴형 인버터 아래 접속반 */
export interface JunctionBox {
  id: string;
  name: string;
  status: OperationStatus;
  capacityKw: number;
  /** 접속반에 물린 채널 */
  channels: StringUnit[];
}

/**
 * 발전소에 설치된 인버터.
 * 스트링형은 스트링이 바로 물리고, 센트럴형은 접속반을 거쳐 채널이 물린다.
 */
export interface Inverter {
  id: string;
  schoolId: string;
  name: string;
  /** string = 스트링 직결형, central = 접속반 경유형 */
  type: 'string' | 'central';
  capacityKw: number;
  /** 표시 상태. RTU 가 끊겨 있으면 통신단절가 된다. */
  status: OperationStatus;
  /** 인버터 자체의 발전 상태 — 통신 문제를 걷어 낸 값 (SFR-009-03) */
  ownStatus: OperationStatus;
  /** 이 인버터를 물고 있는 수집장치 상태 */
  rtuStatus: RtuStatus;
  /** 검출된 고장코드. 정상이면 null */
  faultCode: string | null;
  /** 발전성능비(0~1) */
  pr: number;
  /** 이용률(0~1) */
  cf: number;
  todayKwh: number;
  /** 내부 온도(℃) */
  temperature: number;
  /** 최근 7일 PR 추이 */
  prTrend: number[];
  /** 스트링형일 때만 채워진다. */
  strings: StringUnit[];
  /** 센트럴형일 때만 채워진다. */
  junctionBoxes: JunctionBox[];
}

/**
 * 고장 분류 (SFR-011-05 / SFR-014-04 — 정상 포함 6종 이상).
 * KNN 분류 모델이 내놓는 라벨 묶음에 대응한다.
 */
export type FaultCategory =
  | 'normal'
  | 'module'
  | 'wiring'
  | 'thermal'
  | 'insulation'
  | 'sensor'
  | 'communication';

/** 고장코드 사전 */
export interface FaultCode {
  code: string;
  label: string;
  category: FaultCategory;
  severity: Severity;
  /** 이 고장이 유발하는 운영 상태 */
  defaultStatus: OperationStatus;
  /** 판정 대상이 되는 계층. 일사량계는 계층 밖이라 빈 배열이다. */
  appliesTo: NodeKind[];
  /** 사용자 눈높이 설명 (SFR-013-06) */
  technicalDetail: string;
  causes: string[];
  actions: string[];
}

/** 일자별 성능 지표 */
export interface PerformancePoint {
  date: string;
  /** 발전성능비(0~1) */
  pr: number;
  /** 이용률(0~1) */
  cf: number;
  /** 실측 발전량(kWh) */
  actualKwh: number;
  /** 기대 발전량(kWh) */
  expectedKwh: number;
}
