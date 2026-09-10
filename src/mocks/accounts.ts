import { USER_TYPE } from '@/configs/codes';
import type { UserTypeCode } from '@/configs/codes';
import type { AuthUser, LoginPolicy, ManagedUser, Role } from '@/interface/account';
import type { ChangeLog } from '@/interface/changeLog';
import { getSchoolById, SCHOOLS } from './schools';
import { createRandom, hashSeed, pickNumber, pickOne } from './random';
import { stampAgo } from './today';

/** 교육기관 계정이 담당하는 학교. 목업 트리의 실제 노드와 맞물려야 한다. */
const INSTITUTION_PLANT_ID = 'cheonan-1';

const institutionSchool = getSchoolById(INSTITUTION_PLANT_ID);

/**
 * 데모 계정.
 * 실제로는 서버가 인증하지만, 목업에서는 아이디로 이 목록을 찾아 로그인한다.
 */
export const ACCOUNTS: AuthUser[] = [
  {
    id: 'cne-admin',
    name: '김도현',
    role: 'superAdmin',
    orgName: '충청남도교육청 교육과정평가정보원',
    department: '정보인프라부',
    email: 'admin@cne.go.kr',
    plantIds: [],
  },
  {
    id: 'cne-office',
    name: '박세연',
    role: 'admin',
    orgName: '충청남도교육청',
    department: '시설과',
    email: 'office@cne.go.kr',
    plantIds: [],
  },
  {
    id: 'school-cheonan',
    name: '이준서',
    role: 'institution',
    orgName: institutionSchool?.name ?? '천안 소재 학교',
    department: '행정실',
    email: 'school@cne.go.kr',
    plantIds: [INSTITUTION_PLANT_ID],
  },
];

/**
 * 응답의 `userTypeCode` 를 등급으로 옮기는 유일한 지점.
 * 코드값은 `configs/codes.ts` 가 쥔다 — 화면은 코드를 직접 쓰지 않는다.
 */
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
 * 라우트 가드·메뉴·세션 길이가 저마다 판정하면 한 곳만 늘어나 권한이 새므로 여기 한 줄을 본다.
 */
export const ADMIN_ROLES: Role[] = ['superAdmin', 'developer'];

export function isAdminRole(role: Role | undefined): boolean {
  return role !== undefined && ADMIN_ROLES.includes(role);
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

const ACCOUNT_BY_ID = new Map(ACCOUNTS.map((account) => [account.id, account]));

export function getAccountById(id: string): AuthUser | null {
  return ACCOUNT_BY_ID.get(id.trim()) ?? null;
}

// ── 사용자 관리 시드 (SFR-018) ──────────────────────────────
const USER_SURNAME = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
const USER_GIVEN = ['서준', '하윤', '지호', '수아', '은우', '지민', '예준', '다은', '시우', '채원'];

function buildManagedUsers(): ManagedUser[] {
  const next = createRandom(hashSeed('cne-users-2026'));

  // 교육청 계정 두 자리 + 학교 담당자. 데모 로그인 계정과 같은 인물은 그대로 싣는다.
  const office: ManagedUser[] = ACCOUNTS.map((account, index) => ({
    id: account.id,
    // 서버는 사용자 번호와 로그인 계정을 따로 갖는다 (userId · loginId).
    userId: index + 1,
    loginId: account.id.replace('cne-', ''),
    name: account.name,
    role: account.role,
    orgName: account.orgName,
    email: account.email,
    phone: account.role === 'superAdmin' ? '010-2841-0114' : '010-3517-0132',
    plantIds: account.plantIds,
    lastLoginAt: stampAgo(account.role === 'institution' ? 1 : 0, `09:0${Math.round(pickNumber(next, 0, 9))}`),
    locked: false,
  }));

  const schools: ManagedUser[] = SCHOOLS.filter((_, index) => index % 4 === 1).map((school, index) => {
    const name = `${pickOne(next, USER_SURNAME)}${pickOne(next, USER_GIVEN)}`;
    const neverLoggedIn = next() > 0.88;

    return {
      id: `mgr-${school.id}`,
      userId: ACCOUNTS.length + index + 1,
      loginId: `mgr${String(index + 11)}`,
      name,
      role: 'institution',
      orgName: school.name,
      email: `mgr${String(index + 11)}@school.cne.go.kr`,
      phone: `010-${String(3000 + Math.round(pickNumber(next, 0, 6999)))}-${String(1000 + Math.round(pickNumber(next, 0, 8999)))}`,
      plantIds: [school.id],
      lastLoginAt: neverLoggedIn
        ? null
        : stampAgo(Math.round(pickNumber(next, 0, 20)), `1${Math.round(pickNumber(next, 0, 7))}:${10 + Math.round(pickNumber(next, 0, 49))}`),
      // 잠긴 계정은 확률에 맡기지 않는다 — 한 건도 안 나오면 해제 화면을 볼 길이 없다.
      locked: index % 9 === 4,
    };
  });

  /*
    그룹관리자 — 여러 발전소를 한 사람이 함께 맡는다 (SFR-018, 화면정의 「발전소 그룹」).
    맡은 곳이 하나도 없는 사람과 아주 많은 사람을 섞어 둔다 — 목록과 편집 화면이 그 양 끝에서
    어떻게 보이는지가 확인해야 할 지점이다.
  */
  const GROUP_SPANS = [6, 12, 1, 0, 23];
  const groups: ManagedUser[] = GROUP_SPANS.map((span, index) => ({
    id: `grp-${index + 1}`,
    userId: ACCOUNTS.length + schools.length + index + 1,
    loginId: `grp${String(index + 1).padStart(2, '0')}`,
    name: `${pickOne(next, USER_SURNAME)}${pickOne(next, USER_GIVEN)}`,
    role: 'group',
    orgName: '충청남도교육청',
    email: `grp${String(index + 1).padStart(2, '0')}@cne.go.kr`,
    phone: `010-${String(4000 + index * 111)}-${String(2000 + index * 137)}`,
    plantIds: SCHOOLS.slice(index * 7, index * 7 + span).map((school) => school.id),
    lastLoginAt: stampAgo(index + 1, `10:${10 + index * 7}`),
    locked: false,
  }));

  return [...office, ...groups, ...schools];
}

export const SEED_USERS: ManagedUser[] = buildManagedUsers();

/**
 * 담당자 변경 이력 시드 (SFR-018-04).
 * 학교는 인사이동으로 담당자가 자주 바뀌므로, 최근 몇 건을 미리 깔아 둔다.
 */
export const SEED_USER_CHANGES: ChangeLog[] = (() => {
  const targets = SEED_USERS.filter((user) => user.role === 'institution').slice(1, 5);

  const rows: (Omit<ChangeLog, 'id' | 'targetType' | 'targetId' | 'targetName'> & { index: number })[] = [
    { index: 0, at: stampAgo(4, '14:20'), actor: '김도현', field: '연락처', before: '041-000-0000', after: targets[0]?.phone ?? '-' },
    { index: 1, at: stampAgo(9, '11:05'), actor: '김도현', field: '담당자', before: '전임 담당자', after: targets[1]?.name ?? '-' },
    {
      index: 2,
      at: stampAgo(17, '16:42'),
      actor: '박세연',
      field: '연락처',
      before: '010-0000-0000',
      after: targets[2]?.phone ?? '-',
    },
    { index: 3, at: stampAgo(23, '09:31'), actor: '김도현', field: '등급', before: ROLE_LABEL.group, after: ROLE_LABEL.institution },
  ];

  return rows
    .filter((row) => targets[row.index])
    .map(({ index, ...rest }) => ({
      ...rest,
      id: `UC-26${String(10 + index)}`,
      targetType: 'user' as const,
      targetId: targets[index].id,
      targetName: targets[index].name,
    }));
})();

/** SFR-026 로그인 설정. 관리자는 권한이 큰 만큼 유지시간을 짧게 둔다. */
export const LOGIN_POLICY: LoginPolicy = {
  passwordResetDays: 90,
  maxFailCount: 5,
  adminSessionMinutes: 30,
  userSessionMinutes: 60,
};
