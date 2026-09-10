import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  ManageUserAddParams,
  ManageUserDetail,
  ManageUserModifyParams,
  ManageUserPage,
  ManageUserPageParams,
} from './type';

/** 사용자 관리 API — PK 는 userId */
export const getManageUserPage = async (params: ManageUserPageParams) => {
  const { data } = await apiClient.get<PagingResponse<ManageUserPage>>('/manage/user/page', { params });

  return data;
};

export const getManageUserDetail = async (userId: number) => {
  const { data } = await apiClient.get<ManageUserDetail>('/manage/user/detail', { params: { userId } });

  return data;
};

export const postManageUser = (data: ManageUserAddParams) => apiClient.post('/manage/user', data);

export const putManageUser = (data: ManageUserModifyParams) => apiClient.put('/manage/user', data);

export const deleteManageUser = (userId: number) => apiClient.delete('/manage/user', { params: { userId } });
