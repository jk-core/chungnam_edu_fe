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

export const postChangePassword = (data: ChangePasswordParams) => apiClient.post('/user/password', data);

/** 지금 쓰는 기기만 */
export const postLogout = () => apiClient.post('/user/logout');

/** 로그인해 둔 모든 기기 */
export const postLogoutAll = () => apiClient.post('/user/logout/all');

/*
  담당 발전소(`powerPlantIds`)는 명세에 있으나 BE 가 아직 내려주지 않는다. 빈 배열이
  「제한 없음」이므로 그대로 메워 둔다 — 칸이 실리기 시작하면 아래 두 줄을 지우고
  응답 타입을 `UserDetail` 로 되돌린다.
*/
type UserDetailWire = Omit<UserDetail, 'powerPlantIds'>;
const withPowerPlantIds = (data: UserDetailWire): UserDetail => ({ ...data, powerPlantIds: [] });

export const getUserInfo = async () => {
  const { data } = await apiClient.get<UserDetailWire>('/user/userInfo');

  return withPowerPlantIds(data);
};

/** 토큰이 담고 있는 값으로 답한다 — DB 를 다시 보지 않아 갱신이 늦을 수 있다 */
export const getUserInfoByToken = async () => {
  const { data } = await apiClient.get<UserDetailWire>('/user/token/Info');

  return withPowerPlantIds(data);
};

export const getUserDropdownList = async (name?: string) => {
  const { data } = await apiClient.get<UserDropdown[]>('/user/list/dropdown', { params: { name } });

  return data;
};
