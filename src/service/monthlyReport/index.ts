import apiClient from '@/service';
import type { MonthlyReport, MonthlyReportParams } from './type';

/** 월간보고서 API — 인쇄 지면 다섯 장을 한 번에 받는다 */
export const getMonthlyReport = async (params: MonthlyReportParams) => {
  const { data } = await apiClient.get<MonthlyReport>('/monthlyReport', { params });

  return data;
};
