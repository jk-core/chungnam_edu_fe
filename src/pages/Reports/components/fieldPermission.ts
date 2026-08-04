import { STATE_ORDER } from '@/mocks/fieldReport';
import type { AuthUser } from '@/interface/account';
import type { FieldReport, ReportState } from '@/interface/fieldReport';

/**
 * 현장보고서 접근 통제 (SFR-021-16).
 *
 * - 교육기관 담당자: 담당 학교 보고서를 쓰고 제출까지 한다. 남의 보고서는 열지 못한다.
 * - 교육청 담당자: 전체를 열람하고 검토·확인으로 넘긴다. 작성은 현장 몫이라 막는다.
 * - 관리자: 전부 할 수 있다.
 */
export interface FieldPermission {
  canWrite: boolean;
  /** 작성 버튼을 막은 이유 — 버튼 옆에 그대로 적는다 */
  writeBlockedReason?: string;
  canShare: boolean;
  /** 이 보고서를 다음 단계로 넘길 수 있는지 */
  canAdvance: (report: FieldReport) => boolean;
  /** 이 보고서를 열람할 수 있는지 */
  canRead: (report: FieldReport) => boolean;
}

/** 현장이 직접 넘길 수 있는 마지막 단계 — 그 뒤 검토·확인은 교육청 몫이다. */
const FIELD_LAST_STATE: ReportState = 'submitted';

export function getFieldPermission(user: AuthUser | null): FieldPermission {
  const role = user?.role ?? 'institution';
  const ownPlants = user?.plantIds ?? [];

  const canRead = (report: FieldReport) => (
    role === 'institution' && ownPlants.length > 0 ? ownPlants.includes(report.schoolId) : true
  );

  if (role === 'office') {
    return {
      canWrite: false,
      writeBlockedReason: '작성은 학교 담당자 권한입니다. 제출된 보고서를 검토·확인할 수 있습니다.',
      canShare: true,
      canAdvance: (report) => report.state !== 'draft' && !isLast(report.state),
      canRead,
    };
  }

  if (role === 'institution') {
    return {
      canWrite: true,
      canShare: true,
      // 제출까지만 — 검토·확인은 교육청이 판단한다.
      canAdvance: (report) => canRead(report) && STATE_ORDER.indexOf(report.state) < STATE_ORDER.indexOf(FIELD_LAST_STATE),
      canRead,
    };
  }

  return { canWrite: true, canShare: true, canAdvance: (report) => !isLast(report.state), canRead };
}

function isLast(state: ReportState): boolean {
  return STATE_ORDER.indexOf(state) >= STATE_ORDER.length - 1;
}
