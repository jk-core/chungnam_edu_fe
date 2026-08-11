/** 교육부 연계 전송 결과 (SFR-027) */
export type IntegrationResult = 'success' | 'fail' | 'retried';

/** 전송 이력 한 건 */
export interface IntegrationLog {
  id: string;
  at: string;
  /** 전송 대상 시스템 */
  target: string;
  /** 이번 회차에 보낸 수집 데이터 행 수 — 가공 없이 원본을 그대로 보낸다 */
  rowCount: number;
  result: IntegrationResult;
  /** HTTP 응답 코드 */
  responseCode: number;
  latencyMs: number;
  /** 실패 사유 — 성공이면 null */
  failReason: string | null;
}

/** 기간별 성공률 요약 (SFR-027-06) */
export interface IntegrationSummary {
  label: string;
  total: number;
  success: number;
  rate: number;
}
