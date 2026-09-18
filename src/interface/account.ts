/**
 * 계정 등급 (userTypeCode).
 * 서버 코드는 `configs/codes.ts` 의 `USER_TYPE` 이 쥐고, `configs/roles.ts` 의
 * `roleFromCode`·`roleToCode` 가 이 어휘와 맞바꾼다.
 */
export type Role = 'institution' | 'group' | 'educationOffice' | 'admin' | 'superAdmin' | 'developer';

/**
 * 로그인한 사용자 — `/user/userInfo` 가 주는 것이 전부다.
 *
 * 소속·부서·이메일은 응답에 없어 여기 두지 않는다. 자리만 남겨 두면 화면이 언제나 빈 칸을
 * 그리게 되고, 그 빈 칸이 「등록하지 않은 계정」인지 「서버가 안 주는 값」인지 구분되지 않는다.
 */
export interface AuthUser {
  /** 서버가 매기는 사용자 번호 (userId) */
  userId: number;
  /** 로그인 계정 (loginId) */
  loginId: string;
  name: string;
  role: Role;
  /** 조회할 수 있는 발전소. **빈 배열이 「제한 없음」**이다 */
  powerPlantIds: number[];
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
  /** 소속 기관 표기 */
  orgName: string;
  email: string;
  /** 휴대전화번호 (cellPhone) */
  phone: string;
  plantIds: string[];
  /** 마지막 로그인 — 없으면 null */
  lastLoginAt: string | null;
  /** 잠금 계정 여부 (로그인 실패 초과) */
  locked: boolean;
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
