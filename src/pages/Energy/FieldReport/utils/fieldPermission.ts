import { STATE_ORDER } from '@/mocks/fieldReport';
import type { AuthUser } from '@/interface/account';
import type { FieldReport, ReportState } from '@/interface/fieldReport';

/**
 * 현장보고서 접근 통제 (SFR-021-16).
 *
 * - 수용가·그룹관리자: 맡은 발전소 보고서를 쓰고 제출까지 한다. 반려된 건은 고쳐서 다시 낸다.
 * - 게스트: 전체를 열람하고 검토·확인으로 넘기거나 반려한다. 작성은 현장 몫이라 막는다.
 * - 관리자·개발자: 전부 할 수 있다.
 */
export interface FieldPermission {
  canWrite: boolean;
  /** 작성 버튼을 막은 이유 — 버튼 옆에 그대로 적는다 */
  writeBlockedReason?: string;
  /** 이 보고서를 다음 단계로 넘길 수 있는지 */
  canAdvance: (report: FieldReport) => boolean;
  /** 이 보고서를 반려로 되돌릴 수 있는지 (SFR-021-08) */
  canReject: (report: FieldReport) => boolean;
  /** 이 보고서를 다시 열어 고칠 수 있는지 (SFR-021-09) */
  canEdit: (report: FieldReport) => boolean;
  /** 이 보고서를 열람할 수 있는지 */
  canRead: (report: FieldReport) => boolean;
}

/** 현장이 직접 넘길 수 있는 마지막 단계 — 그 뒤 검토·확인은 교육청 몫이다. */
const FIELD_LAST_STATE: ReportState = 'submitted';

/** 검토 쪽에서 되돌릴 수 있는 자리 — 아직 확인이 끝나지 않은 것만 반려한다. */
const REJECTABLE: ReportState[] = ['submitted', 'reviewing'];

export function getFieldPermission(user: AuthUser | null): FieldPermission {
  const role = user?.role ?? 'customer';
  const ownPlants = user?.plantIds ?? [];

  // 맡은 발전소가 정해진 등급은 그 밖을 읽지 못한다 — 수용가는 자기 것, 그룹관리자는 맡은 곳들.
  const isScoped = role === 'customer' || role === 'group';
  const canRead = (report: FieldReport) => (
    isScoped && ownPlants.length > 0 ? ownPlants.includes(report.schoolId) : true
  );

  if (role === 'guest') {
    return {
      canWrite: false,
      writeBlockedReason: '작성은 수용가 권한입니다. 제출된 보고서를 검토·확인하거나 반려할 수 있습니다.',
      canAdvance: (report) => report.state !== 'draft' && report.state !== 'rejected' && !isLast(report.state),
      canReject: (report) => REJECTABLE.includes(report.state),
      // 검토자는 남의 보고서 내용을 고치지 않는다 — 되돌려 보내고 현장이 고친다.
      canEdit: () => false,
      canRead,
    };
  }

  if (isScoped) {
    return {
      canWrite: true,
      // 제출까지만 — 검토·확인은 교육청이 판단한다.
      canAdvance: (report) => canRead(report)
        && report.state !== 'rejected'
        && STATE_ORDER.indexOf(report.state) < STATE_ORDER.indexOf(FIELD_LAST_STATE),
      canReject: () => false,
      // 작성중이거나 되돌아온 건만 고친다. 확인까지 끝난 보고서는 손대지 않는다.
      canEdit: (report) => canRead(report) && (report.state === 'draft' || report.state === 'rejected'),
      canRead,
    };
  }

  return {
    canWrite: true,
    canAdvance: (report) => report.state !== 'rejected' && !isLast(report.state),
    canReject: (report) => REJECTABLE.includes(report.state),
    canEdit: (report) => report.state !== 'confirmed',
    canRead,
  };
}

function isLast(state: ReportState): boolean {
  return STATE_ORDER.indexOf(state) >= STATE_ORDER.length - 1;
}
