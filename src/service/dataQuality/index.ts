import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  ManageDataQualityOverview,
  ManageDataQualityPage,
  ManageDataQualityPageParams,
  ManageDataQualityParams,
} from './type';

/** 데이터 품질 API */
export const getManageDataQualityOverview = async (params: ManageDataQualityParams) => {
  const { data } = await apiClient.get<ManageDataQualityOverview>('/manage/dataQuality/overview', { params });

  return data;
};

export const getManageDataQualityPage = async (params: ManageDataQualityPageParams) => {
  const { data } = await apiClient.get<PagingResponse<ManageDataQualityPage>>('/manage/dataQuality/page', { params });

  return data;
};
