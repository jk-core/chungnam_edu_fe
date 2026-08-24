import type { UserFormValues } from '@/service/user/type';
import type { ManagedUser } from '@/interface/account';

export const EMPTY_VALUES: UserFormValues = {
  name: '',
  email: '',
  phone: '',
  loginId: '',
  password: '',
  passwordConfirm: '',
  role: 'customer',
};

/** 고칠 사람의 값을 옮긴다. 기존 비밀번호는 받아 오지 않는다 — 비워 두면 그대로 둔다는 뜻이다. */
export function toFormValues(target: ManagedUser): UserFormValues {
  return {
    name: target.name,
    email: target.email,
    phone: target.phone,
    loginId: target.loginId,
    password: '',
    passwordConfirm: '',
    // 라디오가 담을 수 있는 건 넷뿐이다. 개발자는 목록에서 이미 걸러져 여기 닿지 않는다.
    role: target.role === 'developer' ? 'admin' : target.role,
  };
}
