import apiClient, { FILE_TIMEOUT } from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  OperationHistoryChart,
  OperationHistoryChartParams,
  OperationHistoryExcelParams,
  OperationHistoryPage,
  OperationHistoryPageParams,
} from './type';

/** 운전이력 API — 계측이 실어 온 원시값이라 경로가 /gath/sola 밑이다 */
export const getOperationHistoryPage = async (params: OperationHistoryPageParams) => {
  const { data } = await apiClient.get<PagingResponse<OperationHistoryPage>>(
    '/gath/sola/inverter/raw/page',
    { params },
  );

  return data;
};

export const getOperationHistoryChart = async (params: OperationHistoryChartParams) => {
  const { data } = await apiClient.get<OperationHistoryChart[]>('/gath/sola/inverter/raw/chart', { params });

  return data;
};

export const getOperationHistoryExcel = async (params: OperationHistoryExcelParams) => {
  const { data } = await apiClient.get<Blob>('/gath/sola/inverter/raw/excel', {
    params,
    responseType: 'blob',
    timeout: FILE_TIMEOUT,
  });

  return data;
};
