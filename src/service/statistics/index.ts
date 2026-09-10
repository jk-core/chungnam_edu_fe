import apiClient, { FILE_TIMEOUT } from '@/service';
import type {
  StatisticsBasis,
  StatisticsBasisParams,
  StatisticsInverterChart,
  StatisticsInverterOverview,
  StatisticsInverterParams,
  StatisticsInverterString,
  StatisticsPowerPlantChart,
  StatisticsPowerPlantInverter,
  StatisticsPowerPlantOverview,
  StatisticsPowerPlantParams,
} from './type';

/** 발전통계 API — 발전소로 열 때 */
export const getStatisticsPowerPlantOverview = async (params: StatisticsPowerPlantParams) => {
  const { data } = await apiClient.get<StatisticsPowerPlantOverview>('/statistics/powerPlant/overview', { params });

  return data;
};

export const getStatisticsPowerPlantChart = async (params: StatisticsPowerPlantParams) => {
  const { data } = await apiClient.get<StatisticsPowerPlantChart[]>('/statistics/powerPlant/chart', { params });

  return data;
};

export const getStatisticsPowerPlantInverterList = async (params: StatisticsPowerPlantParams) => {
  const { data } = await apiClient.get<StatisticsPowerPlantInverter[]>(
    '/statistics/powerPlant/inverter/list',
    { params },
  );

  return data;
};

export const getStatisticsPowerPlantExcel = async (params: StatisticsPowerPlantParams) => {
  const { data } = await apiClient.get<Blob>('/statistics/powerPlant/excel', {
    params,
    responseType: 'blob',
    timeout: FILE_TIMEOUT,
  });

  return data;
};

/** 발전통계 API — 설비로 열 때 */
export const getStatisticsInverterOverview = async (params: StatisticsInverterParams) => {
  const { data } = await apiClient.get<StatisticsInverterOverview>('/statistics/inverter/overview', { params });

  return data;
};

export const getStatisticsInverterChart = async (params: StatisticsInverterParams) => {
  const { data } = await apiClient.get<StatisticsInverterChart[]>('/statistics/inverter/chart', { params });

  return data;
};

export const getStatisticsInverterStringList = async (params: StatisticsInverterParams) => {
  const { data } = await apiClient.get<StatisticsInverterString[]>('/statistics/inverter/string/list', { params });

  return data;
};

export const getStatisticsInverterExcel = async (params: StatisticsInverterParams) => {
  const { data } = await apiClient.get<Blob>('/statistics/inverter/excel', {
    params,
    responseType: 'blob',
    timeout: FILE_TIMEOUT,
  });

  return data;
};

/** 시군구·교육지원청 집계 */
export const getStatisticsBasis = async (params: StatisticsBasisParams) => {
  const { data } = await apiClient.get<StatisticsBasis[]>('/statistics/basis', { params });

  return data;
};

export const getStatisticsBasisExcel = async (params: StatisticsBasisParams) => {
  const { data } = await apiClient.get<Blob>('/statistics/basis/excel', {
    params,
    responseType: 'blob',
    timeout: FILE_TIMEOUT,
  });

  return data;
};
