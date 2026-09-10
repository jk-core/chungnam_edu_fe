import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  ManagePowerPlantAddParams,
  ManagePowerPlantDetail,
  ManagePowerPlantModifyParams,
  ManagePowerPlantPage,
  ManagePowerPlantPageParams,
} from './type';

/** 발전소 관리 API — PK 는 powerPlantId */
export const getManagePowerPlantPage = async (params: ManagePowerPlantPageParams) => {
  const { data } = await apiClient.get<PagingResponse<ManagePowerPlantPage>>('/manage/powerPlant/page', { params });

  return data;
};

export const getManagePowerPlantDetail = async (powerPlantId: number) => {
  const { data } = await apiClient.get<ManagePowerPlantDetail>('/manage/powerPlant/detail', { params: { powerPlantId } });

  return data;
};

export const postManagePowerPlant = (data: ManagePowerPlantAddParams) => apiClient.post('/manage/powerPlant', data);

export const putManagePowerPlant = (data: ManagePowerPlantModifyParams) => apiClient.put('/manage/powerPlant', data);

export const deleteManagePowerPlant = (powerPlantId: number) => apiClient.delete('/manage/powerPlant', { params: { powerPlantId } });
