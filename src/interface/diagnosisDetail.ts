import type { OperationStatus } from './status';

/*
  진단 예측·효율 시점 타입은 여기 없다 — 서버 계약(`service/diagnosis/type.ts`)이 쥔다.
  남은 것은 아직 목업으로 도는 수집 품질 화면 몫이다.
*/

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
