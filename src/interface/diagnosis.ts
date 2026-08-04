import type { DiagnosisFaultCode } from './equipment';
import type { OperationStatus } from './status';

/** AI 고장분석 진행 단계 */
export type AnalysisStage = 'scan' | 'classify' | 'reason' | 'done';

export interface AnalysisProgress {
  stage: AnalysisStage;
  /** 0~100 */
  percent: number;
}

/** 설비 한 대에 대한 분석 소견 */
export interface DiagnosisFinding {
  id: string;
  equipmentName: string;
  /** 상위 설비 이름 — 어디에 달린 설비인지 */
  parentName: string;
  status: OperationStatus;
  /** 규칙엔진이 확정한 고장코드. 정상이면 null */
  faultCode: DiagnosisFaultCode | null;
  faultLabel: string;
  /** 최근 진단 효율(%) */
  diagEfficiency: number;
  /** 짐작되는 원인 서술 */
  cause: string;
  /** 권장 조치 */
  recommendation: string;
  /** 적설(눈)로 인한 일시적 저하 의심 */
  snowSuspected: boolean;
}

/** AI 고장분석 결과 한 건 */
export interface DiagnosisReport {
  targetId: string;
  targetName: string;
  startDate: string;
  endDate: string;
  /** 확정 고장이 있는지 */
  hasFault: boolean;
  /** 일사량계 오염·이상 의심 */
  irradSensorSuspected: boolean;
  /** 전체를 아우르는 참고 소견. 문장 단위로 나눠 순차 노출한다. */
  insight: string[];
  /** 소견 생성에 쓴 모델 표기 */
  model: string;
  generatedAt: string;
  findings: DiagnosisFinding[];
}
