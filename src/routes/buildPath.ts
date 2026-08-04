import { PATH } from './routes';

/**
 * 상세 화면 경로 빌더.
 * `:id` 가 붙은 리터럴을 PATH 에 섞으면 `<Link to>` 의 타입 검사가 헐거워지므로 여기서만 만든다.
 */
export const buildPath = {
  /** 운전이력 상세 (SFR-009-04) */
  operationHistoryDetail: (id: string) => `${PATH.COLLECTION_HISTORY}/${id}`,
  /** 고장진단 상세 (SFR-013-08/09) */
  diagnosisFaultDetail: (id: string) => `${PATH.AI_DIAGNOSIS_OVERVIEW}/${id}`,
  /** 현장보고서 상세 (SFR-021-11) */
  fieldReportDetail: (id: string) => `${PATH.REPORTS_FIELD}/${id}`,
  /** 게시글 상세 (SFR-025) */
  boardDetail: (id: string) => `${PATH.REPORTS_BOARD}/${id}`,
  /** 사용자 상세 (SFR-018) */
  adminUserDetail: (id: string) => `${PATH.ADMIN_USERS}/${id}`,
  /** 기관 고정 교육용 대시보드 (SFR-005) */
  solarEdu: (orgId: string) => `${PATH.SOLAR_EDU}/${orgId}`,
};
