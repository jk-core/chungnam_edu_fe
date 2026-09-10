import apiClient from '@/service';
import type { ManageServerHealth, ManageServerHealthDatabase, ManageServerHealthIncident } from './type';

/** 서버 자원 현황 API */
export const getManageServerHealthList = async () => {
  const { data } = await apiClient.get<ManageServerHealth[]>('/manage/serverHealth/list');

  return data;
};

export const getManageServerHealthDatabase = async () => {
  const { data } = await apiClient.get<ManageServerHealthDatabase>('/manage/serverHealth/database');

  return data;
};

export const getManageServerHealthIncidentList = async () => {
  const { data } = await apiClient.get<ManageServerHealthIncident[]>('/manage/serverHealth/incident/list');

  return data;
};
