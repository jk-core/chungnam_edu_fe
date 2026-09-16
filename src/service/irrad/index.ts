import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  IrradDropdown,
  ManageIrradAddParams,
  ManageIrradDetail,
  ManageIrradModifyParams,
  ManageIrradPage,
  ManageIrradPageParams,
} from './type';

/** 일사량계 관리 API — PK 는 irradId */
export const getManageIrradPage = async (params: ManageIrradPageParams) => {
  const { data } = await apiClient.get<PagingResponse<ManageIrradPage>>('/manage/equipment/irrad/page', { params });

  return data;
};

export const getManageIrradInfo = async (irradId: number) => {
  const { data } = await apiClient.get<ManageIrradDetail>('/manage/equipment/irrad/info', { params: { irradId } });

  return data;
};

export const postManageIrrad = (data: ManageIrradAddParams) => apiClient.post('/manage/equipment/irrad', data);

export const putManageIrrad = (data: ManageIrradModifyParams) => apiClient.put('/manage/equipment/irrad', data);

export const deleteManageIrrad = (irradId: number) => apiClient.delete('/manage/equipment/irrad', { params: { irradId } });

/** 발전소 폼의 일사량계 검색기가 쓴다 */
export const getIrradDropdownList = async (name?: string) => {
  const { data } = await apiClient.get<IrradDropdown[]>('/equipment/irrad/list/dropdown', { params: { name } });

  return data;
};
