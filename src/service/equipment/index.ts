import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  ManageEquipmentAddParams,
  ManageEquipmentDetail,
  ManageEquipmentModifyParams,
  ManageEquipmentPage,
  ManageEquipmentPageParams,
} from './type';

/** 설비 관리 API — PK 는 cid */
export const getManageEquipmentPage = async (params: ManageEquipmentPageParams) => {
  const { data } = await apiClient.get<PagingResponse<ManageEquipmentPage>>('/manage/equipment/page', { params });

  return data;
};

export const getManageEquipmentDetail = async (cid: number) => {
  const { data } = await apiClient.get<ManageEquipmentDetail>('/manage/equipment/detail', { params: { cid } });

  return data;
};

export const postManageEquipment = (data: ManageEquipmentAddParams) => apiClient.post('/manage/equipment', data);

export const putManageEquipment = (data: ManageEquipmentModifyParams) => apiClient.put('/manage/equipment', data);

export const deleteManageEquipment = (cid: number) => apiClient.delete('/manage/equipment', { params: { cid } });
