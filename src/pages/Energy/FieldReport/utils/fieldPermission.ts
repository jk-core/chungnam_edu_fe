import { isReviewRole, isScopedRole } from '@/mocks/accounts';
import type { AuthUser } from '@/interface/account';
import type { FieldReport } from '@/interface/fieldReport';

/**
 * 현장보고서 접근 통제 (SFR-021-16).
 *
 * **작성은 모든 등급이 한다.** 갈리는 것은 어디까지 읽고 무엇을 매길 수 있는가다.
 * - 기관담당자(2002)·그룹관리자(2005): 맡은 발전소만 읽고, 제 보고서를 제출한다.
 * - 교육지원청(2010): 전체를 읽고, 제 보고서를 제출한다.
 * - 2997 이상: 전체를 읽고, 제출된 건에 검토·반려·확인을 매긴다.
 */
export interface FieldPermission {
  /** 작성한 보고서를 제출할 수 있는지 */
  canSubmit: (report: FieldReport) => boolean;
  /** 제출된 보고서에 검토·반려·확인을 매길 수 있는지 (SFR-021-08) */
  canManage: (report: FieldReport) => boolean;
  /** 이 보고서를 다시 열어 고칠 수 있는지 (SFR-021-09) */
  canEdit: (report: FieldReport) => boolean;
  /** 이 보고서를 열람할 수 있는지 */
  canRead: (report: FieldReport) => boolean;
}

export function getFieldPermission(user: AuthUser | null): FieldPermission {
  const role = user?.role ?? 'institution';

  /*
    맡은 발전소가 정해진 등급은 그 밖을 읽지 못한다 — 기관담당자는 자기 것, 그룹관리자는 맡은 곳들.
    그런데 v2.0 의 `/user/userInfo` 가 담당 발전소를 주지 않아 「어느 곳인지」를 모른다.
    모르는 채로 전부 열어 주면 기관담당자가 남의 학교 보고서를 읽게 되므로, 목록이 올 때까지는
    묶이는 등급에게 아무것도 열지 않는다. BE 가 칸을 늘리면 그 목록으로 판정한다.
  */
  const isReadable = !isScopedRole(role);

  return {
    canSubmit: (report) => isReadable && report.state === 'draft',
    // 아직 내지 않은 보고서는 검토할 것이 없다.
    canManage: (report) => isReviewRole(role) && report.state !== 'draft',
    // 작성중이거나 되돌아온 건만 고친다. 검토로 넘어간 뒤에는 되돌려 보내고 다시 고쳐 낸다.
    canEdit: (report) => isReadable && (report.state === 'draft' || report.state === 'rejected'),
    canRead: () => isReadable,
  };
}
