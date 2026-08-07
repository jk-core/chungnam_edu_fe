import { PATH } from './routes';

/**
 * 상세 화면 경로 빌더.
 * `:id` 가 붙은 리터럴을 PATH 에 섞으면 `<Link to>` 의 타입 검사가 헐거워지므로 여기서만 만든다.
 */
export const buildPath = {
  /**
   * 발전통계 조회 뎁스 (SFR-007).
   * 인자가 없으면 도 전체, 발전소만 주면 발전소 단, 인버터까지 주면 인버터 단이다.
   */
  energyStatistics: (plantId?: string | null, inverterId?: string | null) => {
    if (!plantId) return PATH.ENERGY_STATISTICS;
    if (!inverterId) return `${PATH.ENERGY_STATISTICS}/${plantId}`;

    return `${PATH.ENERGY_STATISTICS}/${plantId}/${inverterId}`;
  },
  /** 운전이력 상세 (SFR-009-04) */
  operationHistoryDetail: (id: string) => `${PATH.ENERGY_HISTORY}/${id}`,
  /** 고장진단 상세 (SFR-013-08/09) */
  diagnosisFaultDetail: (id: string) => `${PATH.AI_DIAGNOSIS_OVERVIEW}/${id}`,
  /** 현장보고서 상세 (SFR-021-11) */
  fieldReportDetail: (id: string) => `${PATH.ENERGY_FIELD_REPORT}/${id}`,
  /** 게시글 상세 (SFR-025) */
  boardDetail: (id: string) => `${PATH.GUIDE_NOTICE}/${id}`,
  /** 사용자 상세 (SFR-018) */
  adminUserDetail: (id: string) => `${PATH.ADMIN_USERS}/${id}`,
  /** 기관 고정 교육용 대시보드 (SFR-005) */
  solarEdu: (orgId: string) => `${PATH.SOLAR_EDU}/${orgId}`,
};
