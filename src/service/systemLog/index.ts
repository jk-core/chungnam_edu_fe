import apiClient from '@/service';
import type { PagingResponse } from '@/service/common';
import type { SysLogDetail, SysLogPageParams } from './type';

/** 로그 수집 데이터 API */
export const getSysLogPage = async (params: SysLogPageParams) => {
  const { data } = await apiClient.get<PagingResponse<SysLogDetail>>('/system/log/list/page', { params });

  return data;
};
