import apiClient from '@/service';
import type { LoginPolicy } from './type';

/** 로그인 설정 API — 로그인 전에도 부르므로 인증을 걸지 않는다 */
export const getLoginPolicy = async () => {
  const { data } = await apiClient.get<LoginPolicy>('/loginPolicy');

  return data;
};

export const putLoginPolicy = (data: LoginPolicy) => apiClient.put('/loginPolicy', data);
