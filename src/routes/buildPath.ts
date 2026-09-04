import type { BoardKind } from '@/interface/board';
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
  /*
    게시판은 공지사항·문의하기가 따로 선다 (SFR-025).
    목록·글쓰기·글 하나가 저마다 주소를 가져, 주고받으면 같은 화면이 열린다.
  */
  board: (kind: BoardKind) => (kind === 'notice' ? PATH.GUIDE_NOTICE : PATH.GUIDE_INQUIRY),
  boardWrite: (kind: BoardKind) => `${buildPath.board(kind)}/write`,
  boardDetail: (kind: BoardKind, postId: string) => `${buildPath.board(kind)}/${postId}`,
  boardEdit: (kind: BoardKind, postId: string) => `${buildPath.board(kind)}/${postId}/edit`,
  /*
    알림 하나를 펼친 알림이력 (SFR-022).
    헤더 종에서 누른 알림이 목록의 조회 조건에 걸리지 않을 수 있어, 어느 알림인지를 주소에
    실어 보낸다 — 받는 쪽이 조건과 무관하게 그 건을 찾아 편다.
  */
  alertDetail: (id: string) => `${PATH.AI_DIAGNOSIS_ALERTS}?alert=${encodeURIComponent(id)}`,
  /** 운전이력 상세 (SFR-009-04) */
  operationHistoryDetail: (id: string) => `${PATH.ENERGY_HISTORY}/${id}`,
  /*
    AI 진단은 발전소 → 인버터 → 스트링까지 내려간다.
    진단 판정이 그 자리까지 나오므로 주소도 세 칸을 둔다 (SFR-013-04/07).
  */
  diagnosis: (plantId?: string, inverterId?: string, unitId?: string) => {
    if (!plantId) return PATH.AI_DIAGNOSIS_OVERVIEW;
    if (!inverterId) return `${PATH.AI_DIAGNOSIS_OVERVIEW}/${plantId}`;
    if (!unitId) return `${PATH.AI_DIAGNOSIS_OVERVIEW}/${plantId}/${inverterId}`;

    return `${PATH.AI_DIAGNOSIS_OVERVIEW}/${plantId}/${inverterId}/${unitId}`;
  },
  /** 현장보고서 상세 (SFR-021-11) */
  fieldReportDetail: (id: string) => `${PATH.ENERGY_FIELD_REPORT}/${id}`,
  /** 사용자 상세 (SFR-018) */
  adminUserDetail: (id: string) => `${PATH.ADMIN_USERS}/${id}`,
  /** 기관 고정 교육용 대시보드 (SFR-005) */
  solarEdu: (orgId: string) => `${PATH.SOLAR_EDU_A}/${orgId}`,
};
