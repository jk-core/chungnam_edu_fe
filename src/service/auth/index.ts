import { z } from 'zod';
import apiClient from '@/service';
import { checked } from '@/service/validate';
import { userDetailSchema, userDropdownSchema } from './type';
import type {
  ChangePasswordParams,
  InitializePasswordParams,
  ReissuanceParams,
  SignIn,
  SignInParams,
  UserDetail,
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

/*
  계약과 견줄 때 그 칸은 빼고 본다 — 스키마에는 있지만 서버가 보내지 않는 것이 **알려진 사실**이라,
  그대로 견주면 매번 「불일치」 로 잡혀 정작 모르고 있던 어긋남이 그 소리에 묻힌다.
*/
const userDetailWireSchema = userDetailSchema.omit({ powerPlantIds: true });

export const getUserInfo = async () => {
  const { data } = await apiClient.get<unknown>('/user/userInfo');

  return withPowerPlantIds(checked(userDetailWireSchema, data, 'GET /user/userInfo'));
};

/** 토큰이 담고 있는 값으로 답한다 — DB 를 다시 보지 않아 갱신이 늦을 수 있다 */
export const getUserInfoByToken = async () => {
  const { data } = await apiClient.get<unknown>('/user/token/Info');

  return withPowerPlantIds(checked(userDetailWireSchema, data, 'GET /user/token/Info'));
};

export const getUserDropdownList = async (name?: string) => {
  const { data } = await apiClient.get<unknown>('/user/list/dropdown', { params: { name } });

  return checked(z.array(userDropdownSchema), data, 'GET /user/list/dropdown');
};
