import apiClient from '@/service';
import type {
  ChangePasswordParams,
  InitializePasswordParams,
  ReissuanceParams,
  SignIn,
  SignInParams,
  UserDetail,
  UserDropdown,
} from './type';

/** 인증 API — 변경 계열은 본문 없이 HTTP 상태만 돌려준다 */
export const postSignIn = async (data: SignInParams) => {
  const { data: signIn } = await apiClient.post<SignIn>('/user/signIn', data);

  return signIn;
};

/** 새 accessToken 문자열을 그대로 돌려준다 */
export const postReissuance = async (data: ReissuanceParams) => {
  const { data: accessToken } = await apiClient.post<string>('/user/reissuance', data);

  return accessToken;
};

/** 비밀번호 초기화 (관리자용) */
export const postInitializePassword = (data: InitializePasswordParams) => apiClient.post('/user/password/initialize', data);

export const postChangePassword = (data: ChangePasswordParams) => apiClient.post('/user/password/change', data);

/** 지금 쓰는 기기만 */
export const postLogout = () => apiClient.post('/user/logout');

/** 로그인해 둔 모든 기기 */
export const postLogoutAll = () => apiClient.post('/user/logout/all');

export const getUserInfo = async () => {
  const { data } = await apiClient.get<UserDetail>('/user/userInfo');

  return data;
};

/** 토큰이 담고 있는 값으로 답한다 — DB 를 다시 보지 않아 갱신이 늦을 수 있다 */
export const getUserInfoByToken = async () => {
  const { data } = await apiClient.get<UserDetail>('/user/token/Info');

  return data;
};

export const getUserDropdownList = async (name?: string) => {
  const { data } = await apiClient.get<UserDropdown[]>('/user/list/dropdown', { params: { name } });

  return data;
};
