import type { Role } from '@/interface/account';
import { PATH } from '@/routes/routes';

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
    label: '발전통계',
    path: PATH.STATISTICS,
    children: [
      {
        label: '발전 현황',
        path: PATH.STATISTICS_OVERVIEW,
        description: '고른 설비 계층에 맞춰 발전량과 세부 데이터를 봅니다.',
        needsScope: true,
        requirements: ['SFR-008-01', 'SFR-008-03', 'SFR-008-04', 'SFR-008-05'],
      },
      {
        label: '기간별 통계',
        path: PATH.STATISTICS_PERIOD,
        description: '일·월·연 단위 집계와 전기간 대비 증감을 확인합니다.',
        needsScope: true,
        requirements: ['SFR-007-01', 'SFR-007-02', 'SFR-007-03', 'SFR-007-04'],
      },
      {
        label: '학교별 비교',
        path: PATH.STATISTICS_SCHOOL,
        description: '학교 단위로 발전량과 이용률을 견줍니다.',
        needsScope: true,
        requirements: ['SFR-004-09', 'SFR-008-04'],
      },
      {
        label: '환경 기여도',
        path: PATH.STATISTICS_ECO,
        description: '온실가스 저감량과 식수 효과로 환산해 봅니다.',
        needsScope: true,
        requirements: ['SFR-007-11'],
      },
    ],
  },
  {
    label: '수집데이터',
    path: PATH.COLLECTION,
    children: [
      {
        label: '트렌드 조회',
        path: PATH.COLLECTION_TREND,
        description: '15분 주기로 수집된 계측값을 겹쳐 봅니다.',
        needsScope: true,
        requirements: ['SFR-010-03', 'SFR-010-04'],
      },
      {
        label: '원시 데이터',
        path: PATH.COLLECTION_RAW,
        description: '수집 시각별 원본 값과 상태 코드를 표로 확인합니다.',
        needsScope: true,
        requirements: ['SFR-003-08', 'SFR-010-03', 'SFR-010-05'],
      },
      {
        label: '수집 현황',
        path: PATH.COLLECTION_STATUS,
        description: '설비별 수집률과 결측 구간을 점검합니다.',
        needsScope: true,
        requirements: ['SFR-001-09', 'SFR-001-10', 'SFR-002-16', 'SFR-002-17'],
      },
      {
        label: '운전이력',
        path: PATH.COLLECTION_HISTORY,
        description: '인버터별 통신주기 운전 기록을 조회하고 내려받습니다.',
        needsScope: true,
        requirements: ['SFR-009-01', 'SFR-009-02', 'SFR-009-03', 'SFR-009-04', 'SFR-010-01', 'SFR-010-02'],
      },
    ],
  },
  {
    label: 'AI진단',
    path: PATH.AI_DIAGNOSIS,
    children: [
      {
        label: 'AI 진단',
        path: PATH.AI_DIAGNOSIS_OVERVIEW,
        description: '발전 지표와 설비별 진단, 일자별 발전 효율을 한 화면에서 봅니다.',
        needsScope: true,
        requirements: [
          'SFR-011-03', 'SFR-011-04',
          'SFR-013-01', 'SFR-013-02', 'SFR-013-03', 'SFR-013-04', 'SFR-013-05',
          'SFR-013-06', 'SFR-013-07', 'SFR-013-08', 'SFR-013-09', 'SFR-013-10',
          'SFR-020-02',
        ],
      },
      {
        label: '점검 일정',
        path: PATH.AI_DIAGNOSIS_SCHEDULE,
        description: '예정·완료된 점검 일정을 확인합니다.',
        needsScope: true,
        requirements: ['SFR-021-19'],
      },
    ],
  },
  {
    label: '알림이력',
    path: PATH.ALERTS,
    children: [
      {
        label: '알림 목록',
        path: PATH.ALERTS_LIST,
        description: '발생한 알림을 조건별로 조회합니다.',
        needsScope: true,
        requirements: ['SFR-022-01', 'SFR-022-02', 'SFR-022-03', 'SFR-022-04'],
      },
      {
        label: '미조치 알림',
        path: PATH.ALERTS_PENDING,
        description: '아직 조치되지 않은 알림을 경과 순으로 보고 조치 예정일을 정합니다.',
        needsScope: true,
        requirements: ['SFR-022-03', 'SFR-022-05'],
      },
      {
        label: '고장 타임라인',
        path: PATH.ALERTS_TIMELINE,
        description: '고장 발생부터 조치 완료까지 단계별 이력을 관리합니다.',
        needsScope: true,
        requirements: ['SFR-015-01', 'SFR-015-02', 'SFR-015-03', 'SFR-015-04', 'SFR-015-05'],
      },
      {
        label: '알림 설정',
        path: PATH.ALERTS_SETTINGS,
        description: '알림이 울리는 조건과 받는 방법을 정합니다.',
        requirements: ['SFR-022-05'],
      },
    ],
  },
  {
    label: '보고·소통',
    path: PATH.REPORTS,
    children: [
      {
        label: '월간보고서',
        path: PATH.REPORTS_MONTHLY,
        description: '설비별 월간보고서를 자동 생성해 내려받습니다.',
        requirements: ['SFR-019-01', 'SFR-019-02', 'SFR-019-03', 'SFR-019-05', 'SFR-020-01', 'SFR-020-03', 'SFR-020-05'],
      },
      {
        label: '현장보고서',
        path: PATH.REPORTS_FIELD,
        description: '점검 체크리스트와 현장 사진으로 보고서를 작성합니다.',
        requirements: ['SFR-021-01', 'SFR-021-02', 'SFR-021-04', 'SFR-021-07', 'SFR-021-11', 'SFR-021-17'],
      },
      {
        label: '게시판',
        path: PATH.REPORTS_BOARD,
        description: '공지사항과 Q&A 를 주고받습니다.',
        requirements: ['SFR-025-01', 'SFR-025-02', 'SFR-025-04', 'SFR-025-05', 'SFR-025-06'],
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
  roles: ['admin'],
  children: [
    {
      label: '발전소·설비 관리',
      path: PATH.ADMIN_PLANTS,
      description: '발전소·인버터·스트링·환경센서를 등록하고 수정 이력을 남깁니다.',
      requirements: ['SFR-016-01', 'SFR-016-02', 'SFR-016-03', 'SFR-016-04', 'SFR-016-05', 'SFR-016-06'],
    },
    {
      label: '시스템장비 관리',
      path: PATH.ADMIN_DEVICES,
      description: '수집장치·인버터·모듈 정보와 교체·이설 이력을 관리합니다.',
      requirements: ['SFR-017-01', 'SFR-017-02', 'SFR-017-03', 'SFR-017-04', 'SFR-017-05', 'SFR-017-06', 'SFR-017-07'],
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
      description: '교육청·교육기관 계정 트리와 접근 가능 화면을 정합니다.',
      requirements: ['SFR-023-01', 'SFR-023-02', 'SFR-023-03'],
    },
    {
      label: '연계이력 관리',
      path: PATH.ADMIN_INTEGRATIONS,
      description: '교육부 전송 성공·실패 이력과 재송신을 다룹니다.',
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
      description: '설비별·기간별 수집 품질과 AI 학습 제외 건을 확인합니다.',
      requirements: ['SFR-003-05', 'SFR-003-06', 'SFR-003-07', 'SFR-012-10', 'SFR-012-11'],
    },
    {
      label: '보안 관제',
      path: PATH.ADMIN_SECURITY,
      description: '접속 현황과 로그인 실패 추이를 살핍니다.',
      requirements: ['SER-001-18', 'SER-001-19'],
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
