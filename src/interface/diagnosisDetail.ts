import type { DiagnosisFaultCode } from './equipment';
import type { OperationStatus } from './status';

/** DC 전압·전류 예측 대 실측 한 시점 (SFR-014-01/10) */
export interface PredictionPoint {
  time: string;
  actualVoltage: number;
  predVoltage: number;
  actualCurrent: number;
  predCurrent: number;
  /** 실측 ÷ 예측 (SFR-014-03 비율 기반) */
  ratio: number;
  /** 편차(%) */
  deviation: number;
  /** KNN 이 내놓은 고장 분류 코드 */
  faultCode: DiagnosisFaultCode;
}

/** 모델 성능 지표 (SFR-014-05, SFR-011-06/07) */
export interface ModelMetrics {
  voltageR2: number;
  currentR2: number;
  faultAccuracy: number;
  trainRatio: number;
  sampleCount: number;
}

/** 진단 효율 한 시점 (SFR-013-02) */
export interface DiagEfficiencyPoint {
  date: string;
  /** 진단 효율(%) */
  efficiency: number;
  /** 모델이 추정한 발전량(kWh) */
  estimateKwh: number;
  /** 실측 발전량(kWh) */
  measuredKwh: number;
  faultCode: DiagnosisFaultCode;
}

/** 설비별·기간별 품질 지표 (SFR-012-10) */
export interface QualityStatus {
  schoolId: string;
  schoolName: string;
  regionName: string;
  status: OperationStatus;
  totalRows: number;
  validRows: number;
  /** 유효 비율(0~1) */
  qualityRate: number;
}
