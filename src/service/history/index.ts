import apiClient from '@/service';
import type { ManageHistory, ManageHistoryParams } from './type';

/** 등록 정보 변경 이력 API — 일곱 관리 화면이 이 하나를 함께 본다 */
export const getManageHistory = async (params: ManageHistoryParams) => {
  const { data } = await apiClient.get<ManageHistory[]>('/manage/history', { params });

  return data;
};
