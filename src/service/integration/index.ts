import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  ManageIntegrationChart,
  ManageIntegrationOverview,
  ManageIntegrationPage,
  ManageIntegrationPageParams,
  ManageIntegrationResendParams,
} from './type';

/** 교육부 연계이력 API */
export const getManageIntegrationOverview = async () => {
  const { data } = await apiClient.get<ManageIntegrationOverview>('/manage/integration/overview');

  return data;
};

export const getManageIntegrationChart = async () => {
  const { data } = await apiClient.get<ManageIntegrationChart[]>('/manage/integration/chart');

  return data;
};

export const getManageIntegrationPage = async (params: ManageIntegrationPageParams) => {
  const { data } = await apiClient.get<PagingResponse<ManageIntegrationPage>>('/manage/integration/page', { params });

  return data;
};

export const postManageIntegrationResend = (data: ManageIntegrationResendParams) =>
  apiClient.post('/manage/integration/resend', data);
