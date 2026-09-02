import { ADMIN_ROLES } from '@/mocks/accounts';
import { PATH } from '@/routes/routes';
import type { Role } from '@/interface/account';

export interface NavChild {
  label: string;
  path: string;
  description: string;
  /** 비우면 전 역할 허용 */
  roles?: Role[];
  /** 좌측 "조회 대상" 패널이 필요한 화면인지 */
  needsScope?: boolean;
  /** 이 화면이 덮는 요구사항ID — docs/requirements-traceability.md 의 근거 */
  requirements?: string[];
}

export interface NavSection {
  label: string;
  path: string;
  /** 홈은 하위 메뉴가 없다. 나머지는 좌측 LNB 로 노출된다. */
  children: NavChild[];
  roles?: Role[];
}

/** GNB · LNB · 브레드크럼이 공유하는 단일 내비게이션 정의. */
export const NAVIGATION: NavSection[] = [
  {
    label: '홈',
    path: PATH.HOME,
    children: [],
  },
  {
    label: '발전관리',
    path: PATH.ENERGY,
    children: [
      {
        label: '발전통계',
        path: PATH.ENERGY_STATISTICS,
        description: '계층·기간별 발전량과 환경 기여도를 한 화면에서 봅니다. 날짜를 고르는 달력에 그 날 실적이 함께 나옵니다.',
        needsScope: true,
        requirements: [
          'SFR-006-01', 'SFR-006-02',
          'SFR-007-01', 'SFR-007-02', 'SFR-007-03', 'SFR-007-05', 'SFR-007-06', 'SFR-007-07',
          'SFR-008-01', 'SFR-008-02', 'SFR-008-05', 'SFR-008-06', 'SFR-008-07',
          'SFR-010-01', 'SFR-010-02',
        ],
      },
      {
        label: '운전이력',
        path: PATH.ENERGY_HISTORY,
        description: '수집주기별 계측값을 표로 조회하고 내려받습니다.',
        needsScope: true,
        requirements: ['SFR-009-04', 'SFR-010-03', 'SFR-010-04', 'SFR-010-05'],
      },
      {
        label: '현장보고서',
        path: PATH.ENERGY_FIELD_REPORT,
        description: '점검 체크리스트와 현장 사진으로 보고서를 작성하고, 점검 일정을 관리합니다.',
        needsScope: true,
        requirements: [
          'SFR-021-01', 'SFR-021-02', 'SFR-021-03', 'SFR-021-08',
          'SFR-021-16', 'SFR-021-17', 'SFR-021-18', 'SFR-021-19',
        ],
      },
      /*
        등록·수정은 관리자 콘솔이 맡고 여기는 보는 쪽만 맡는다.
        매일 보는 통계·이력·보고서 뒤에 두는 것은 제원이 가끔 확인하는 값이기 때문이다.
      */
      {
        label: '발전소 정보',
        path: PATH.ENERGY_PLANT_INFO,
        description: '고른 발전소의 등록 제원과 설비 구성을 봅니다. 등록·수정은 관리자 콘솔에서 합니다.',
        needsScope: true,
        requirements: [
          'SFR-016-01', 'SFR-016-02',
          'SFR-017-01', 'SFR-017-02', 'SFR-017-04', 'SFR-017-05', 'SFR-017-06',
        ],
      },
    ],
  },
  {
    label: 'AI진단',
    path: PATH.AI_DIAGNOSIS,
    children: [
      {
        label: '발전진단',
        path: PATH.AI_DIAGNOSIS_OVERVIEW,
        description: '설비별 진단 현황과 일자별 발전 효율을 봅니다.',
        needsScope: true,
        requirements: [
          'SFR-011-03', 'SFR-011-04',
          'SFR-013-01', 'SFR-013-02', 'SFR-013-03', 'SFR-013-04', 'SFR-013-05',
          'SFR-013-06', 'SFR-013-07', 'SFR-013-08', 'SFR-013-09', 'SFR-013-10',
          'SFR-020-02',
        ],
      },
      {
        label: '월간보고서',
        path: PATH.AI_DIAGNOSIS_MONTHLY,
        description: '한 달 발전 실적과 진단 결과를 보고서로 정리해 인쇄합니다.',
        needsScope: true,
        requirements: ['SFR-019-01', 'SFR-019-06', 'SFR-020-01', 'SFR-020-03', 'SFR-020-04'],
      },
      {
        label: '알림이력',
        path: PATH.AI_DIAGNOSIS_ALERTS,
        description: '발생한 알림과 고장 타임라인을 조회하고, 미조치 건과 알림 조건을 관리합니다.',
        needsScope: true,
        requirements: [
          'SFR-015-01', 'SFR-015-02', 'SFR-015-03', 'SFR-015-04', 'SFR-015-05',
          'SFR-022-01', 'SFR-022-02', 'SFR-022-03', 'SFR-022-04', 'SFR-022-05',
        ],
      },
    ],
  },
  {
    label: '이용안내',
    path: PATH.GUIDE,
    children: [
      {
        label: '공지사항',
        path: PATH.GUIDE_NOTICE,
        description: '시스템 공지와 점검 안내를 봅니다.',
        requirements: ['SFR-025-01', 'SFR-025-02', 'SFR-025-06'],
      },
      {
        label: '문의하기',
        path: PATH.GUIDE_INQUIRY,
        description: '궁금한 점을 남기고 답변을 받습니다.',
        requirements: ['SFR-025-04', 'SFR-025-05'],
      },
    ],
  },
];

/**
 * 관리자 콘솔.
 * GNB 에 올리지 않고 계정 메뉴로 진입한다 — 대메뉴가 15개로 불어나는 것을 막고,
 * 내부망 전용이라는 성격(SER-001-18)도 분리해서 드러난다.
 */
export const ADMIN_NAVIGATION: NavSection = {
  label: '관리자 콘솔',
  path: PATH.ADMIN,
  roles: ADMIN_ROLES,
  children: [
    {
      label: '발전소·설비 관리',
      path: PATH.ADMIN_PLANTS,
      description: '발전소와 그 아래 선 설비·스트링·일사량계를 등록하고 수정 이력을 남깁니다.',
      requirements: ['SFR-016-01', 'SFR-016-02', 'SFR-016-03', 'SFR-016-04', 'SFR-016-05', 'SFR-016-06'],
    },
    {
      label: '시스템장비 관리',
      path: PATH.ADMIN_DEVICES,
      description: '설비 등록에서 고를 인버터·모듈 제품 카탈로그를 등록·수정·삭제하고 변경 이력을 봅니다.',
      requirements: ['SFR-016-05', 'SFR-016-06', 'SFR-017-04', 'SFR-017-05'],
    },
    {
      label: '현장보고서 관리',
      path: PATH.ADMIN_FIELD_REPORTS,
      description: '전체 현장보고서를 훑어 검토·확인·반려로 정리하고, 점검 양식 문항을 고쳐 새 판으로 냅니다.',
      requirements: ['SFR-021-08', 'SFR-021-14'],
    },
    {
      label: '사용자 관리',
      path: PATH.ADMIN_USERS,
      description: '설비 담당자와 권한을 관리합니다. 개인정보는 마스킹해 보여 줍니다.',
      requirements: ['SFR-018-01', 'SFR-018-02', 'SFR-018-03', 'SFR-018-04', 'SFR-018-05'],
    },
    {
      label: '계정·권한 관리',
      path: PATH.ADMIN_ACCOUNTS,
      description: '등급별로 접근 가능한 화면을 정합니다.',
      requirements: ['SFR-023-01', 'SFR-023-02', 'SFR-023-03'],
    },
    {
      label: '교육부 연계이력',
      path: PATH.ADMIN_INTEGRATIONS,
      description: '교육부로 보낸 수집 데이터(raw)의 성공·실패 이력과 재송신을 다룹니다.',
      requirements: ['SFR-027-01', 'SFR-027-02', 'SFR-027-03', 'SFR-027-04', 'SFR-027-05', 'SFR-027-06', 'SFR-027-07'],
    },
    {
      label: '로그인 설정',
      path: PATH.ADMIN_LOGIN_POLICY,
      description: '비밀번호 주기·실패 횟수·유지시간을 설정합니다.',
      requirements: ['SFR-026-01', 'SFR-026-02', 'SFR-026-03', 'SFR-026-04'],
    },
    {
      label: '시스템 활용 통계',
      path: PATH.ADMIN_USAGE,
      description: '기간별·메뉴별 접속 횟수와 기능 이용 현황을 봅니다.',
      requirements: ['SFR-028-01', 'SFR-028-02', 'SFR-028-03'],
    },
    {
      label: '데이터 품질',
      path: PATH.ADMIN_DATA_QUALITY,
      description: '설비별·기간별 수집 데이터의 품질률과 기준 미달 발전소를 확인합니다.',
      requirements: ['SFR-003-05', 'SFR-003-06', 'SFR-003-07', 'SFR-012-10', 'SFR-012-11'],
    },
    {
      label: '서버 자원 현황',
      path: PATH.ADMIN_SERVER_HEALTH,
      description: 'CPU·메모리·네트워크 사용률과 DB 상태를 봅니다.',
      requirements: ['ECR-002-20', 'ECR-002-21', 'ECR-003-13'],
    },
  ],
};

const ALL_SECTIONS = [...NAVIGATION, ADMIN_NAVIGATION];

/** 현재 경로가 속한 대메뉴를 찾는다. 관리자 콘솔도 함께 본다. */
export function findSection(pathname: string): NavSection | undefined {
  if (pathname === PATH.HOME) return NAVIGATION[0];

  return ALL_SECTIONS.find((section) => section.path !== PATH.HOME && pathname.startsWith(section.path));
}

/** 현재 경로에 해당하는 소메뉴를 찾는다. 상세 화면(`/:id`)은 목록 메뉴로 잡아 준다. */
export function findChild(section: NavSection | undefined, pathname: string): NavChild | undefined {
  if (!section) return undefined;

  const exact = section.children.find((child) => child.path === pathname);

  if (exact) return exact;

  // 가장 긴 접두사가 곧 가장 구체적인 메뉴다.
  return section.children
    .filter((child) => pathname.startsWith(`${child.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
}

/** 역할이 볼 수 있는 메뉴만 남긴다 (SFR-023-02/03) */
export function visibleNavigation(role: Role | null): NavSection[] {
  const allows = (roles: Role[] | undefined) => !roles || (role !== null && roles.includes(role));

  return NAVIGATION
    .filter((section) => allows(section.roles))
    .map((section) => ({ ...section, children: section.children.filter((child) => allows(child.roles)) }));
}
