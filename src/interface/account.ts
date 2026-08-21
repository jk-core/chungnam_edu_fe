/**
 * 계정 역할.
 * SFR-023-02 는 교육청 계정에 전체 조회를, SFR-023-03 은 교육기관 계정에 본인 설비만 허용한다.
 * 여기에 SFR-018-05(사용자 관리는 관리자만)를 더해 세 갈래로 나눈다.
 */
export type Role = 'admin' | 'office' | 'group' | 'institution';

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
