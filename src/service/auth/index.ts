import apiClient from '@/service';
import type {
  UserInfo,
  UserPasswordParams,
  UserReissue,
  UserReissueParams,
  UserSignIn,
  UserSignInParams,
} from './type';

/** 인증 API */
export const postUserSignIn = async (data: UserSignInParams) => {
  const { data: signIn } = await apiClient.post<UserSignIn>('/user/signIn', data);

  return signIn;
};

export const postUserReissue = async (data: UserReissueParams) => {
  const { data: reissued } = await apiClient.post<UserReissue>('/user/reissue', data);

  return reissued;
};

export const getUserInfo = async () => {
  const { data } = await apiClient.get<UserInfo>('/user/info');

  return data;
};

export const putUserPassword = (data: UserPasswordParams) => apiClient.put('/user/password', data);
