import type { OperationStatus, RtuStatus, Severity } from './status';
import type { NodeKind } from './tree';

/** 인버터 아래 스트링 */
export interface StringUnit {
  id: string;
  name: string;
  status: OperationStatus;
  capacityKw: number;
  /** 같은 부모 안 다른 형제 대비 출력 비율 */
  relativeOutput: number;
}

/** 발전소에 설치된 인버터. 아래에는 스트링이 바로 물린다. */
export interface Inverter {
  id: string;
  schoolId: string;
  name: string;
  /** 계통 연계 위상 — 소용량은 단상, 그 위는 삼상이다 (SFR-017-04) */
  phase: 'single' | 'three';
  capacityKw: number;
  /** 표시 상태. RTU 가 끊겨 있으면 통신단절가 된다. */
  status: OperationStatus;
  /** 인버터 자체의 발전 상태 — 통신 문제를 걷어 낸 값 (SFR-009-03) */
  ownStatus: OperationStatus;
  /** 이 인버터를 물고 있는 RTU 상태 */
  rtuStatus: RtuStatus;
  /** 검출된 고장코드. 정상이면 null */
  faultCode: DiagnosisFaultCode | null;
  /**
   * 설비 건전도 계수(0~1) — 목업이 계층별 발전량을 깎는 데만 쓰는 내부 값이다.
   * 화면에 직접 내보내지 않는다. 사람이 보는 지표는 발전시간·이용률 쪽이다.
   */
  healthFactor: number;
  /** 이용률(0~1) */
  cf: number;
  todayKwh: number;
  /** 내부 온도(℃) */
  temperature: number;
  /** 최근 7일 발전시간(h) 추이 */
  hoursTrend: number[];
  strings: StringUnit[];
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

/**
 * AI 진단 고장코드 번호.
 * 0 = 정상, 1~6 = 모듈·발전 이상, 7 = 인버터/스트링 정지·고장.
 */
export type DiagnosisFaultCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** 고장코드 사전 */
export interface FaultCode {
  code: DiagnosisFaultCode;
  /** '정상' · '고장코드 3' */
  label: string;
  /** 한 줄 표기용 짧은 원인 — 배지·표 셀에 쓴다 */
  summary: string;
  category: FaultCategory;
  severity: Severity;
  /** 이 고장이 유발하는 운영 상태 */
  defaultStatus: OperationStatus;
  /** 판정 대상이 되는 계층. 일사량계는 계층 밖이라 빈 배열이다. */
  appliesTo: NodeKind[];
  /** 무엇이 잘못됐는지 (SFR-013-06) */
  description: string[];
  /** 조치 방안 */
  plan: string[];
  /** 참고 이미지 — public/image/FaultCode 경로 */
  images: string[];
}

/** 일자별 성능 지표 */
export interface PerformancePoint {
  date: string;
  /** 등가 발전시간(h) = 발전량 ÷ 설비용량 */
  hours: number;
  /** 이용률(0~1) */
  cf: number;
  /** 실측 발전량(kWh) */
  actualKwh: number;
  /** 기대 발전량(kWh) */
  expectedKwh: number;
  /**
   * 발전성능비 PR(0~1) = 실측 ÷ 기대.
   * 일사량으로 계산한 기대 발전량 대비 실제로 얼마나 만들었는지 — 설비 규모와 무관하게 견줄 수 있다.
   */
  pr: number;
}
