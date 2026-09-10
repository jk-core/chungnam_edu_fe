import apiClient from '@/service';
import type { CollectStatus, CollectStatusParams } from './type';

/** 수집 현황 API — 계측 수집 자체를 보는 자리라 경로가 /gath/sola 밑이다 */
export const getCollectStatus = async (params: CollectStatusParams) => {
  const { data } = await apiClient.get<CollectStatus>('/gath/sola/collect/status', { params });

  return data;
};
