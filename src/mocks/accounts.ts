import type { AuthUser, LoginPolicy, ManagedUser, Role, UserChange } from '@/interface/account';
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
    role: 'admin',
    orgName: '충청남도교육청 교육과정평가정보원',
    department: '정보인프라부',
    email: 'admin@cne.go.kr',
    plantIds: [],
  },
  {
    id: 'cne-office',
    name: '박세연',
    role: 'office',
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

export const ROLE_LABEL: Record<Role, string> = {
  admin: '교육청 관리자',
  office: '교육청 담당자',
  institution: '교육기관 담당자',
};

/** 역할별로 무엇까지 볼 수 있는지 — 로그인 화면과 계정 메뉴에서 그대로 쓴다. */
export const ROLE_SCOPE_NOTE: Record<Role, string> = {
  admin: '전체 발전소 조회와 관리자 콘솔을 씁니다.',
  office: '전체 발전소를 조회만 합니다.',
  institution: '담당 학교의 설비만 조회합니다.',
};

const ACCOUNT_BY_ID = new Map(ACCOUNTS.map((account) => [account.id, account]));

export function getAccountById(id: string): AuthUser | null {
  return ACCOUNT_BY_ID.get(id.trim()) ?? null;
}

// ── 사용자 관리 시드 (SFR-018) ──────────────────────────────
const USER_SURNAME = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
const USER_GIVEN = ['서준', '하윤', '지호', '수아', '은우', '지민', '예준', '다은', '시우', '채원'];
const DEPARTMENTS = ['행정실', '행정실', '시설관리팀', '교무행정팀'];

function buildManagedUsers(): ManagedUser[] {
  const next = createRandom(hashSeed('cne-users-2026'));

  // 교육청 계정 두 자리 + 학교 담당자. 데모 로그인 계정과 같은 인물은 그대로 싣는다.
  const office: ManagedUser[] = ACCOUNTS.map((account, index) => ({
    ...account,
    // 서버는 사용자 번호와 로그인 계정을 따로 갖는다 (userId · loginId).
    userId: index + 1,
    loginId: account.id.replace('cne-', ''),
    phone: account.role === 'admin' ? '010-2841-0114' : '010-3517-0132',
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
      department: pickOne(next, DEPARTMENTS),
      email: `mgr${String(index + 11)}@school.cne.go.kr`,
      phone: `010-${String(3000 + Math.round(pickNumber(next, 0, 6999)))}-${String(1000 + Math.round(pickNumber(next, 0, 8999)))}`,
      plantIds: [school.id],
      lastLoginAt: neverLoggedIn
        ? null
        : stampAgo(Math.round(pickNumber(next, 0, 20)), `1${Math.round(pickNumber(next, 0, 7))}:${10 + Math.round(pickNumber(next, 0, 49))}`),
      locked: next() > 0.94,
    };
  });

  return [...office, ...schools];
}

export const SEED_USERS: ManagedUser[] = buildManagedUsers();

/**
 * 담당자 변경 이력 시드 (SFR-018-04).
 * 학교는 인사이동으로 담당자가 자주 바뀌므로, 최근 몇 건을 미리 깔아 둔다.
 */
export const SEED_USER_CHANGES: UserChange[] = (() => {
  const targets = SEED_USERS.filter((user) => user.role === 'institution').slice(1, 5);

  const rows: (Omit<UserChange, 'id' | 'userId' | 'userName'> & { index: number })[] = [
    { index: 0, at: stampAgo(4, '14:20'), actor: '김도현', field: '연락처', before: '041-000-0000', after: targets[0]?.phone ?? '-' },
    { index: 1, at: stampAgo(9, '11:05'), actor: '김도현', field: '담당자', before: '전임 담당자', after: targets[1]?.name ?? '-' },
    // 시드 부서가 무엇이든 전/후가 같아 보이지 않도록 어긋나는 값을 고른다.
    {
      index: 2,
      at: stampAgo(17, '16:42'),
      actor: '박세연',
      field: '부서',
      before: targets[2]?.department === '행정실' ? '교무행정팀' : '행정실',
      after: targets[2]?.department ?? '-',
    },
    { index: 3, at: stampAgo(23, '09:31'), actor: '김도현', field: '권한', before: ROLE_LABEL.office, after: ROLE_LABEL.institution },
  ];

  return rows
    .filter((row) => targets[row.index])
    .map(({ index, ...rest }) => ({
      ...rest,
      id: `UC-26${String(10 + index)}`,
      userId: targets[index].id,
      userName: targets[index].name,
    }));
})();

/** SFR-026 로그인 설정. 관리자는 권한이 큰 만큼 유지시간을 짧게 둔다. */
export const LOGIN_POLICY: LoginPolicy = {
  passwordResetDays: 90,
  maxFailCount: 5,
  adminSessionMinutes: 30,
  userSessionMinutes: 60,
};
