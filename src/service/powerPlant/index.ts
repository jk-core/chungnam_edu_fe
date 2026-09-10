import apiClient from '@/service';
import type {
  PowerPlantHierarchy,
  PowerPlantInfo,
  PowerPlantListItem,
  PowerPlantMarkerInfo,
} from './type';

/** 공용 발전소 API — 지도 마커·선택 모달·조회 대상 패널이 함께 본다 */
export const getPowerPlantList = async () => {
  const { data } = await apiClient.get<PowerPlantListItem[]>('/powerPlant/list');

  return data;
};

export const getPowerPlantHierarchy = async (powerPlantId: number) => {
  const { data } = await apiClient.get<PowerPlantHierarchy>('/powerPlant/hierarchy', { params: { powerPlantId } });

  return data;
};

export const getPowerPlantMarkerInfo = async (powerPlantId: number) => {
  const { data } = await apiClient.get<PowerPlantMarkerInfo>('/powerPlant/markerInfo', { params: { powerPlantId } });

  return data;
};

/** 발전소정보 화면 — 등록 제원 조회 전용 */
export const getPowerPlantInfo = async (powerPlantId: number) => {
  const { data } = await apiClient.get<PowerPlantInfo>('/powerPlantInfo', { params: { powerPlantId } });

  return data;
};
