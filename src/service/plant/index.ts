import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  ManagePowerPlantDetail,
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

/** 대표이미지와 본문을 part 로 가른다 — fileList 는 개수만큼 반복, 나머지는 json part 하나 */
export const postManagePowerPlant = (data: FormData) => apiClient.post('/manage/powerPlant', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

export const putManagePowerPlant = (data: FormData) => apiClient.put('/manage/powerPlant', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

export const deleteManagePowerPlant = (powerPlantId: number) => apiClient.delete('/manage/powerPlant', { params: { powerPlantId } });
