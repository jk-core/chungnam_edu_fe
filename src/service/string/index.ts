import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  ManageStringDetail,
  ManageStringPage,
  ManageStringPageParams,
  ManageStringSaveParams,
} from './type';

/** 스트링 관리 API — 목록·상세는 설비(cid) 단위, 삭제만 stringId 단건이다 */
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
