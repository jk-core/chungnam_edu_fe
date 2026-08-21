/**
 * 계정 등급 (userTypeCode).
 *
 * 게스트 2001 · 수용가 2002 · 그룹관리자 2006 · 관리자 2998 · 개발자 2999.
 * **개발자는 화면에 세우지 않는다** — 등급 선택지에도, 사용자 목록에도 나오지 않는다.
 */
export type Role = 'guest' | 'customer' | 'group' | 'admin' | 'developer';

/** 로그인한 사용자 */
export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  /** 소속 기관 표기 */
  orgName: string;
  department: string;
  email: string;
  /**
   * 조회 가능한 발전소 id 목록.
   * 빈 배열이면 제한 없음(도 전체) — admin·office 가 여기에 해당한다.
   */
  plantIds: string[];
}

/** 사용자 관리 화면이 다루는 설비 담당자 (SFR-018) */
export interface ManagedUser {
  id: string;
  /** 서버가 매기는 사용자 번호 (userId) */
  userId: number;
  /** 로그인 계정 (loginId) */
  loginId: string;
  name: string;
  role: Role;
  email: string;
  /** 휴대전화번호 (cellPhone) */
  phone: string;
  plantIds: string[];
  /** 마지막 로그인 — 없으면 null */
  lastLoginAt: string | null;
  /** 잠금 계정 여부 (로그인 실패 초과) */
  locked: boolean;
}

/**
 * 담당자 정보 변경 이력 (SFR-018-04).
 * 발전소 이력(AssetChange)과 같은 결로 필드 단위 전/후를 남긴다.
 */
export interface UserChange {
  id: string;
  userId: string;
  userName: string;
  at: string;
  actor: string;
  field: string;
  before: string;
  after: string;
}

/** 로그인 정책 (SFR-026) */
export interface LoginPolicy {
  /** 비밀번호 재설정 주기(일) */
  passwordResetDays: number;
  /** 허용 로그인 실패 횟수 */
  maxFailCount: number;
  /** 관리자 로그인 유지시간(분) */
  adminSessionMinutes: number;
  /** 일반 사용자 로그인 유지시간(분) */
  userSessionMinutes: number;
}
