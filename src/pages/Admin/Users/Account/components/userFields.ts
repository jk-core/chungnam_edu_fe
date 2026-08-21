import type { ManagedUser, Role } from '@/interface/account';

/** 비밀번호 규칙 — 영대문자·영소문자·숫자·특수문자를 각 하나 이상, 공백 없이 8~20자. */
export const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])(?=\S+$).{8,20}$/;

/** 폼 힌트와 오류 문구가 갈리지 않게 규칙을 한 문장으로 적어 둔다 */
export const PASSWORD_HINT = '영대문자·소문자·숫자·특수문자 각 1개 이상, 8~20자';

/** 로그인 계정에 쓸 수 있는 글자 */
export const LOGIN_ID = /^[A-Za-z0-9_]{4,20}$/;

/** 이메일 형식 — 서버가 보는 것과 같은 최소 규칙이다 */
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 이름 길이 */
export const NAME_MAX = 14;

/** 이메일 길이 */
export const EMAIL_MAX = 50;

export interface UserDraft {
  loginId: string;
  /** 새 비밀번호. 수정에서 비워 두면 기존 비밀번호를 그대로 쓴다 */
  password: string;
  /** 서버로 보내지 않는다 — 오타를 잡으려고만 받는다 */
  passwordConfirm: string;
  name: string;
  role: Role;
  email: string;
  phone: string;
}

/** 이력에 남길 항목 — 화면의 입력 항목과 이름을 맞춘다 (SFR-018-04). */
export const TRACKED: { key: keyof UserDraft & keyof ManagedUser; label: string }[] = [
  { key: 'loginId', label: '로그인 ID' },
  { key: 'name', label: '이름' },
  { key: 'email', label: '이메일' },
  { key: 'phone', label: '연락처' },
  { key: 'role', label: '등급' },
];

export const EMPTY_DRAFT: UserDraft = {
  loginId: '',
  password: '',
  passwordConfirm: '',
  name: '',
  role: 'customer',
  email: '',
  phone: '',
};

/** 고칠 사람의 값을 초안으로 옮긴다. 기존 비밀번호는 받아 오지 않는다 — 비워 두면 그대로 둔다는 뜻이다. */
export function draftOf(target: ManagedUser | null): UserDraft {
  return target
    ? {
      loginId: target.loginId,
      password: '',
      passwordConfirm: '',
      name: target.name,
      role: target.role,
      email: target.email,
      phone: target.phone,
    }
    : EMPTY_DRAFT;
}
