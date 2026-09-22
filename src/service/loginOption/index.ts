import apiClient from '@/service';
import type { LoginOption, LoginOptionModifyParams } from './type';

/** 로그인 설정 API */
export const getLoginOption = async () => {
  const { data } = await apiClient.get<LoginOption>('/manage/loginOption');

  return data;
};

export const putLoginOption = (data: LoginOptionModifyParams) => apiClient.put('/manage/loginOption', data);
