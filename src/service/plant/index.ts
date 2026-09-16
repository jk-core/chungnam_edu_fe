import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  ManagePowerPlantAddParams,
  ManagePowerPlantDetail,
  ManagePowerPlantModifyParams,
  ManagePowerPlantPage,
  ManagePowerPlantPageParams,
} from './type';

/** 발전소 관리 API — PK 는 powerPlantId. 경로가 소문자 `powerplant` 인 것에 주의한다 */
export const getManagePowerPlantPage = async (params: ManagePowerPlantPageParams) => {
  const { data } = await apiClient.get<PagingResponse<ManagePowerPlantPage>>('/manage/powerplant/page', { params });

  return data;
};

export const getManagePowerPlantInfo = async (powerPlantId: number) => {
  const { data } = await apiClient.get<ManagePowerPlantDetail>('/manage/powerplant/info', { params: { powerPlantId } });

  return data;
};

export const postManagePowerPlant = (data: ManagePowerPlantAddParams) => apiClient.post('/manage/powerplant', data);

export const putManagePowerPlant = (data: ManagePowerPlantModifyParams) => apiClient.put('/manage/powerplant', data);

export const deleteManagePowerPlant = (powerPlantId: number) => apiClient.delete('/manage/powerplant', { params: { powerPlantId } });
