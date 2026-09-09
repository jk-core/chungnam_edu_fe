/**
 * 파라미터가 없는 정적 경로만 둔다.
 * `:id` 가 붙는 상세 경로는 buildPath.ts 의 빌더 함수로 만든다 — Path 유니온의 타입 안전성을 지키기 위함이다.
 *
 * 기존 경로(collection, ai-diagnosis)는 그대로 두고 하위 메뉴만 늘렸다.
 * 폴더·메뉴 이름과 URL 이 어긋나지 않고, 리다이렉트를 떠안지 않아도 된다.
 */
export const PATH = {
  /**
   * 시연에서 볼 화면을 고르는 자리 — **시연용 임시** (2026-09-09 지시).
   *
   * 이 브랜치는 통합관제와 교육용 대시보드만 열어 두고 나머지 길을 막는다. 막힌 곳으로
   * 들어오면 모두 여기로 모이므로, 시연 중에 주소를 잘못 눌러도 빈 화면을 만나지 않는다.
   */
  PREVIEW_CHOICE: '/preview-choice',

  /** 메인 대시보드 (SFR-004, 006, 007) */
  HOME: '/',

  /** 인증·특수 레이아웃 */
  LOGIN: '/login',
  /** 교육청 산하기관 교육용 대시보드 (SFR-005) */
  KIOSK: '/kiosk',
  /** 학생 교육용 태양광 대시보드 — 전기의 여정 (SFR-005) */
  SOLAR_EDU: '/solar-edu',
  /*
    비교용 교육 시안. 눈높이(`?level=`)는 그대로 두고 **보여 주는 방식만** 갈린다 —
    같은 학교의 같은 값을 초·중·고 각각 네 가지로 볼 수 있다. 고르고 나면 이긴 하나만 남긴다.
  */
  SOLAR_EDU_A: '/solar-edu/a',
  SOLAR_EDU_B: '/solar-edu/b',
  SOLAR_EDU_C: '/solar-edu/c',
  /** 통합관제 전체화면 상황판 (SFR-004) */
  CONTROL: '/control',
  /*
    배치 시안. `/control` 이 최종안이고 이쪽은 견줌용이다 —
    보여 주는 값과 판은 그대로 두고 어디에 세우는지·무슨 색인지만 다르다.
    고르고 나면 이긴 하나만 `/control` 에 옮기고 나머지는 지운다.
  */
  CONTROL_B: '/control/b',
  CONTROL_C: '/control/c',
  CONTROL_D: '/control/d',
  CONTROL_E: '/control/e',
  /** 마이페이지 (SFR-024) */
  MY: '/my',

  /** 발전관리 (SFR-007~010, 021) */
  ENERGY: '/energy',
  ENERGY_STATISTICS: '/energy/statistics',
  ENERGY_HISTORY: '/energy/history',
  ENERGY_FIELD_REPORT: '/energy/field-report',
  ENERGY_FIELD_REPORT_NEW: '/energy/field-report/new',
  ENERGY_PLANT_INFO: '/energy/plant-info',

  /** AI진단 (SFR-011, 013~015, 019, 020, 022) */
  AI_DIAGNOSIS: '/ai-diagnosis',
  AI_DIAGNOSIS_OVERVIEW: '/ai-diagnosis/overview',
  AI_DIAGNOSIS_MONTHLY: '/ai-diagnosis/monthly',
  AI_DIAGNOSIS_ALERTS: '/ai-diagnosis/alerts',

  /** 이용안내 (SFR-025) */
  GUIDE: '/guide',
  GUIDE_NOTICE: '/guide/notice',
  GUIDE_INQUIRY: '/guide/inquiry',

  /** 관리자 콘솔 — 내부망 전용 (SER-001-18) */
  ADMIN: '/admin',
  ADMIN_PLANTS: '/admin/plants',
  ADMIN_DEVICES: '/admin/devices',
  ADMIN_FIELD_REPORTS: '/admin/field-reports',
  ADMIN_USERS: '/admin/users',
  ADMIN_ACCOUNTS: '/admin/accounts',
  ADMIN_INTEGRATIONS: '/admin/integrations',
  ADMIN_LOGIN_POLICY: '/admin/login-policy',
  ADMIN_USAGE: '/admin/usage',
  ADMIN_DATA_QUALITY: '/admin/data-quality',
  ADMIN_SERVER_HEALTH: '/admin/server-health',
} as const;

export type Path = (typeof PATH)[keyof typeof PATH];
