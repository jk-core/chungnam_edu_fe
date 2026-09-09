import { USER_TYPE } from '@/configs/codes';
import type { UserFormValues } from '@/service/user/type';
import type { ManagedUser } from '@/interface/account';

export const EMPTY_VALUES: UserFormValues = {
  userName: '',
  orgName: '',
  email: '',
  cellPhone: '',
  loginId: '',
  password: '',
  passwordConfirm: '',
  userTypeCode: USER_TYPE.CODE.기관담당자,
};

/** 고칠 사람의 값을 옮긴다. 기존 비밀번호는 받아 오지 않는다 — 비워 두면 그대로 둔다는 뜻이다. */
export function toFormValues(target: ManagedUser): UserFormValues {
  return {
    userName: target.name,
    orgName: target.orgName,
    email: target.email,
    cellPhone: target.phone,
    loginId: target.loginId,
    password: '',
    passwordConfirm: '',
    /*
      목록이 기관담당자·그룹관리자만 싣는다 — 그 위 등급은 이 폼에 닿지 않으므로 라디오가
      담지 못하는 값이 들어올 자리가 없다.
    */
    userTypeCode: target.role === 'group' ? USER_TYPE.CODE.그룹관리자 : USER_TYPE.CODE.기관담당자,
  };
}
