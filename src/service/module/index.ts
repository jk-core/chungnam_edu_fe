import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  ManageModuleAddParams,
  ManageModuleDetail,
  ManageModuleModifyParams,
  ManageModulePage,
  ManageModulePageParams,
} from './type';

/** 모듈 제품 관리 API — PK 는 moduleId */
export const getManageModulePage = async (params: ManageModulePageParams) => {
  const { data } = await apiClient.get<PagingResponse<ManageModulePage>>('/manage/module/page', { params });

  return data;
};

export const getManageModuleDetail = async (moduleId: number) => {
  const { data } = await apiClient.get<ManageModuleDetail>('/manage/module/detail', { params: { moduleId } });

  return data;
};

export const postManageModule = (data: ManageModuleAddParams) => apiClient.post('/manage/module', data);

export const putManageModule = (data: ManageModuleModifyParams) => apiClient.put('/manage/module', data);

export const deleteManageModule = (moduleId: number) => apiClient.delete('/manage/module', { params: { moduleId } });
