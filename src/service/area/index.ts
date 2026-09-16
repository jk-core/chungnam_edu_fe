import apiClient from '@/service';
import type { AreaDropdown } from './type';

/** 지역 API */
export const getAreaDropdownList = async (name?: string) => {
  const { data } = await apiClient.get<AreaDropdown[]>('/area/list/dropdown', { params: { name } });

  return data;
};
