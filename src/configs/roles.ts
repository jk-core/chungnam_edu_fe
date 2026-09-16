import { USER_TYPE } from '@/configs/codes';
import type { UserTypeCode } from '@/configs/codes';
import type { Role } from '@/interface/account';

/*
  계정 등급과 권한 규칙.

  목업이 아니라 계약이다 — 서버가 주는 `userTypeCode` 를 화면 어휘(`Role`)로 옮기고,
  어느 등급이 무엇을 할 수 있는지 판정한다. 로그인·라우트 가드·메뉴가 모두 여기를 본다.
*/

/** 응답의 `userTypeCode` 를 등급으로 옮기는 유일한 지점. 코드값은 `configs/codes.ts` 가 쥔다 */
const CODE_BY_ROLE: Record<Role, UserTypeCode> = {
  institution: USER_TYPE.CODE.기관담당자,
  group: USER_TYPE.CODE.그룹관리자,
  educationOffice: USER_TYPE.CODE.교육지원청,
  admin: USER_TYPE.CODE['관리자(도교육청)'],
  superAdmin: USER_TYPE.CODE.슈퍼관리자,
  developer: USER_TYPE.CODE.개발자,
};

const ROLE_BY_CODE = new Map<UserTypeCode, Role>(
  (Object.entries(CODE_BY_ROLE) as [Role, UserTypeCode][]).map(([role, code]) => [code, role]),
);

/** 모르는 등급은 가장 좁은 권한으로 떨어뜨린다 — 넓은 쪽으로 두면 못 볼 화면이 열린다. */
export function roleFromCode(code: UserTypeCode | null | undefined): Role {
  return (code === null || code === undefined ? undefined : ROLE_BY_CODE.get(code)) ?? 'institution';
}

export function roleToCode(role: Role): UserTypeCode {
  return CODE_BY_ROLE[role];
}

export const ROLE_LABEL: Record<Role, string> = {
  institution: '기관담당자',
  group: '그룹관리자',
  educationOffice: '교육지원청',
  admin: '관리자(도교육청)',
  superAdmin: '슈퍼관리자',
  developer: '개발자',
};

/**
 * 사용자 관리 화면에서 만들고 고칠 수 있는 등급.
 * 교육지원청 위로는 이 화면에서 다루지 않는다 — 목록도 같은 범위로 좁혀 둔다.
 */
export const SELECTABLE_ROLES = ['institution', 'group'] as const satisfies readonly Role[];

/** 화면에 세우는 등급 — 개발자만 뺀다. 권한표가 이 순서로 열을 세운다. */
export const VISIBLE_ROLES: Role[] = ['institution', 'group', 'educationOffice', 'admin', 'superAdmin'];

/**
 * 제출된 보고서를 검토·확인으로 넘기거나 반려하는 등급 — 2997 이상이다.
 * 작성 자체는 모든 등급이 하고, 여기 등급만 그 뒤 단계를 판정한다.
 */
export const REVIEW_ROLES: Role[] = ['admin', 'superAdmin', 'developer'];

export function isReviewRole(role: Role | undefined): boolean {
  return role !== undefined && REVIEW_ROLES.includes(role);
}

/**
 * 관리자 콘솔에 들어가는 등급 — 슈퍼관리자(2998)·개발자(2999) 둘뿐이다.
 * 라우트 가드와 메뉴가 저마다 판정하면 한 곳만 늘어나 권한이 새므로 여기 한 줄을 본다.
 */
export const ADMIN_ROLES: Role[] = ['superAdmin', 'developer'];

export function isAdminRole(role: Role | undefined): boolean {
  return role !== undefined && ADMIN_ROLES.includes(role);
}

/**
 * 조회 범위가 담당 발전소로 묶이는 등급 (SFR-023-02/03).
 * 어느 발전소로 묶이는지는 `/user/userInfo` 의 `powerPlantIds` 가 말한다.
 */
export const SCOPED_ROLES: Role[] = ['institution', 'group'];

export function isScopedRole(role: Role | undefined): boolean {
  return role !== undefined && SCOPED_ROLES.includes(role);
}

/** 등급별로 무엇까지 볼 수 있는지 — 로그인 화면과 계정 메뉴에서 그대로 쓴다. */
export const ROLE_SCOPE_NOTE: Record<Role, string> = {
  institution: '자기 발전소의 설비를 조회하고 현장보고서를 씁니다.',
  group: '맡은 발전소 여러 곳을 함께 조회하고 현장보고서를 씁니다.',
  educationOffice: '전체 발전소를 조회하고 현장보고서를 씁니다.',
  admin: '전체를 조회하고 제출된 현장보고서를 검토·확인·반려합니다.',
  superAdmin: '전체 발전소 조회와 관리자 콘솔을 씁니다.',
  developer: '전체를 보고 관리자 콘솔을 씁니다. 화면에는 세우지 않습니다.',
};
