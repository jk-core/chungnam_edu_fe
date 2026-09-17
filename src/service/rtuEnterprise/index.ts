import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  ManageRtuEnterpriseAddParams,
  ManageRtuEnterpriseDetail,
  ManageRtuEnterpriseModifyParams,
  ManageRtuEnterprisePage,
  ManageRtuEnterprisePageParams,
} from './type';

/** RTU 업체 관리 API — PK 는 rtuEnterpriseId */
export const getManageRtuEnterprisePage = async (params: ManageRtuEnterprisePageParams) => {
  const { data } = await apiClient.get<PagingResponse<ManageRtuEnterprisePage>>('/manage/rtuEnterprise/page', { params });

  return data;
};

export const getManageRtuEnterpriseDetail = async (rtuEnterpriseId: number) => {
  const { data } = await apiClient.get<ManageRtuEnterpriseDetail>('/manage/rtuEnterprise/detail', {
    params: { rtuEnterpriseId },
  });

  return data;
};

export const postManageRtuEnterprise = (data: ManageRtuEnterpriseAddParams) => apiClient.post('/manage/rtuEnterprise', data);

export const putManageRtuEnterprise = (data: ManageRtuEnterpriseModifyParams) => apiClient.put('/manage/rtuEnterprise', data);

export const deleteManageRtuEnterprise = (rtuEnterpriseId: number) => apiClient.delete('/manage/rtuEnterprise', {
  params: { rtuEnterpriseId },
});
