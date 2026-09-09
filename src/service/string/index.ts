import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  ManageStringDetail,
  ManageStringPage,
  ManageStringPageParams,
  ManageStringSaveParams,
} from './type';

/** 스트링 관리 API — 목록은 설비 단위, 저장은 설비 한 대를 통째로 교체한다 */
export const getManageStringPage = async (params: ManageStringPageParams) => {
  const { data } = await apiClient.get<PagingResponse<ManageStringPage>>('/manage/string/page', { params });

  return data;
};

export const getManageStringDetail = async (cid: number) => {
  const { data } = await apiClient.get<ManageStringDetail>('/manage/string/detail', { params: { cid } });

  return data;
};

export const putManageString = (data: ManageStringSaveParams) => apiClient.put('/manage/string', data);

export const deleteManageString = (stringId: number) => apiClient.delete('/manage/string', { params: { stringId } });
