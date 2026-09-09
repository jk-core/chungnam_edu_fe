import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  ManageInverterAddParams,
  ManageInverterDetail,
  ManageInverterModifyParams,
  ManageInverterPage,
  ManageInverterPageParams,
} from './type';

/** 인버터 제품 관리 API — PK 는 inverterId */
export const getManageInverterPage = async (params: ManageInverterPageParams) => {
  const { data } = await apiClient.get<PagingResponse<ManageInverterPage>>('/manage/inverter/page', { params });

  return data;
};

export const getManageInverterDetail = async (inverterId: number) => {
  const { data } = await apiClient.get<ManageInverterDetail>('/manage/inverter/detail', { params: { inverterId } });

  return data;
};

export const postManageInverter = (data: ManageInverterAddParams) => apiClient.post('/manage/inverter', data);

export const putManageInverter = (data: ManageInverterModifyParams) => apiClient.put('/manage/inverter', data);

export const deleteManageInverter = (inverterId: number) => apiClient.delete('/manage/inverter', { params: { inverterId } });
