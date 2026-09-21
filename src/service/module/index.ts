import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  ManageSolaModuleAddParams,
  ManageSolaModuleDetail,
  ManageSolaModuleModifyParams,
  ManageSolaModulePage,
  ManageSolaModulePageParams,
  SolaModuleDetail,
  SolaModuleDropdown,
  SolaModuleSearchParams,
} from './type';

/** 태양광 모듈 모델 관리 API — PK 는 moduleId */
export const getManageSolaModulePage = async (params: ManageSolaModulePageParams) => {
  const { data } = await apiClient.get<PagingResponse<ManageSolaModulePage>>('/manage/module/page', { params });

  return data;
};

export const getManageSolaModuleDetail = async (moduleId: number) => {
  const { data } = await apiClient.get<ManageSolaModuleDetail>('/manage/module/detail', { params: { moduleId } });

  return data;
};

export const postManageSolaModule = (data: ManageSolaModuleAddParams) => apiClient.post('/manage/module', data);

export const putManageSolaModule = (data: ManageSolaModuleModifyParams) => apiClient.put('/manage/module', data);

export const deleteManageSolaModule = (moduleId: number) => apiClient.delete('/manage/module', { params: { moduleId } });

/*
  아래는 관리 화면 밖에서 모델 제원을 읽는 자리다 — 설비 폼의 모델 검색기와 용량 계산이 쓴다.
  관리 목록과 달리 쪽을 나누지 않고 조건에 맞는 것을 모두 준다.
*/
export const getSolaModuleList = async (params?: SolaModuleSearchParams) => {
  const { data } = await apiClient.get<SolaModuleDetail[]>('/equipment/sola/module/list', { params });

  return data;
};

export const getSolaModuleDropdownList = async (name?: string) => {
  const { data } = await apiClient.get<SolaModuleDropdown[]>('/equipment/sola/module/list/dropdown', { params: { name } });

  return data;
};

export const getSolaModuleInfo = async (moduleId: number) => {
  const { data } = await apiClient.get<SolaModuleDetail>('/equipment/sola/module/info', { params: { moduleId } });

  return data;
};
