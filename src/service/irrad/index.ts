import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  ManageIrradAddParams,
  ManageIrradDetail,
  ManageIrradModifyParams,
  ManageIrradPage,
  ManageIrradPageParams,
} from './type';

/** 일사량계 관리 API — PK 는 irradId */
export const getManageIrradPage = async (params: ManageIrradPageParams) => {
  const { data } = await apiClient.get<PagingResponse<ManageIrradPage>>('/manage/irrad/page', { params });

  return data;
};

export const getManageIrradDetail = async (irradId: number) => {
  const { data } = await apiClient.get<ManageIrradDetail>('/manage/irrad/detail', { params: { irradId } });

  return data;
};

export const postManageIrrad = (data: ManageIrradAddParams) => apiClient.post('/manage/irrad', data);

export const putManageIrrad = (data: ManageIrradModifyParams) => apiClient.put('/manage/irrad', data);

export const deleteManageIrrad = (irradId: number) => apiClient.delete('/manage/irrad', { params: { irradId } });
