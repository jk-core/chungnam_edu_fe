import apiClient from '@/service';
import type {
  ManageUsageLoginChart,
  ManageUsageMenu,
  ManageUsageOverview,
  ManageUsageParams,
} from './type';

/** 시스템 활용 통계 API */
export const getManageUsageOverview = async (params: ManageUsageParams) => {
  const { data } = await apiClient.get<ManageUsageOverview>('/manage/usage/overview', { params });

  return data;
};

export const getManageUsageMenuList = async (params: ManageUsageParams) => {
  const { data } = await apiClient.get<ManageUsageMenu[]>('/manage/usage/menu/list', { params });

  return data;
};

export const getManageUsageLoginChart = async (params: ManageUsageParams) => {
  const { data } = await apiClient.get<ManageUsageLoginChart[]>('/manage/usage/login/chart', { params });

  return data;
};
