/**
 * 파라미터가 없는 정적 경로만 둔다.
 * `:id` 가 붙는 상세 경로는 buildPath.ts 의 빌더 함수로 만든다 — Path 유니온의 타입 안전성을 지키기 위함이다.
 *
 * 기존 경로(collection, ai-diagnosis)는 그대로 두고 하위 메뉴만 늘렸다.
 * 폴더·메뉴 이름과 URL 이 어긋나지 않고, 리다이렉트를 떠안지 않아도 된다.
 */
export const PATH = {
  /** 메인 대시보드 (SFR-004, 006, 007) */
  HOME: '/',

  /** 인증·특수 레이아웃 */
  LOGIN: '/login',
  /** 교육청 산하기관 교육용 대시보드 (SFR-005) */
  KIOSK: '/kiosk',
  /** 학생 교육용 태양광 대시보드 — 전기의 여정 (SFR-005) */
  SOLAR_EDU: '/solar-edu',
  /** 통합관제 전체화면 상황판 (SFR-004) */
  CONTROL: '/control',
  /** 마이페이지 (SFR-024) */
  MY: '/my',

  /** 발전통계 (SFR-007, 008) */
  STATISTICS: '/statistics',
  STATISTICS_OVERVIEW: '/statistics/overview',
  STATISTICS_PERIOD: '/statistics/period',
  STATISTICS_SCHOOL: '/statistics/school',
  STATISTICS_ECO: '/statistics/eco',

  /** 수집데이터 (SFR-001~003, 009, 010) */
  COLLECTION: '/collection',
  COLLECTION_TREND: '/collection/trend',
  COLLECTION_RAW: '/collection/raw',
  COLLECTION_STATUS: '/collection/status',
  COLLECTION_HISTORY: '/collection/history',

  /** AI진단 (SFR-011, 013, 014, 015) */
  AI_DIAGNOSIS: '/ai-diagnosis',
  AI_DIAGNOSIS_SUMMARY: '/ai-diagnosis/summary',
  AI_DIAGNOSIS_EQUIPMENT: '/ai-diagnosis/equipment',
  AI_DIAGNOSIS_FAULTS: '/ai-diagnosis/faults',
  AI_DIAGNOSIS_TIMELINE: '/ai-diagnosis/timeline',
  AI_DIAGNOSIS_SCHEDULE: '/ai-diagnosis/schedule',

  /** 알림이력 (SFR-022) */
  ALERTS: '/alerts',
  ALERTS_LIST: '/alerts/list',
  ALERTS_PENDING: '/alerts/pending',
  ALERTS_SETTINGS: '/alerts/settings',

  /** 보고·소통 (SFR-019, 020, 021, 025) */
  REPORTS: '/reports',
  REPORTS_MONTHLY: '/reports/monthly',
  REPORTS_FIELD: '/reports/field',
  REPORTS_FIELD_NEW: '/reports/field/new',
  REPORTS_BOARD: '/reports/board',

  /** 관리자 콘솔 — 내부망 전용 (SER-001-18) */
  ADMIN: '/admin',
  ADMIN_PLANTS: '/admin/plants',
  ADMIN_DEVICES: '/admin/devices',
  ADMIN_USERS: '/admin/users',
  ADMIN_ACCOUNTS: '/admin/accounts',
  ADMIN_INTEGRATIONS: '/admin/integrations',
  ADMIN_LOGIN_POLICY: '/admin/login-policy',
  ADMIN_USAGE: '/admin/usage',
  ADMIN_DATA_QUALITY: '/admin/data-quality',
  ADMIN_SECURITY: '/admin/security',
} as const;

export type Path = (typeof PATH)[keyof typeof PATH];
