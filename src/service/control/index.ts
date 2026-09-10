import apiClient from '@/service';
import type {
  ControlAggregation,
  ControlAggregationParams,
  ControlFault,
  ControlFilterParams,
  ControlOverview,
  ControlRegion,
} from './type';

/** 통합관제 API */
export const getControlOverview = async (params: ControlFilterParams) => {
  const { data } = await apiClient.get<ControlOverview>('/control/overview', { params });

  return data;
};

export const getControlRegion = async (params: ControlFilterParams) => {
  const { data } = await apiClient.get<ControlRegion[]>('/control/region', { params });

  return data;
};

export const getControlAggregation = async (params: ControlAggregationParams) => {
  const { data } = await apiClient.get<ControlAggregation[]>('/control/aggregation', { params });

  return data;
};

export const getControlFault = async (params: ControlFilterParams) => {
  const { data } = await apiClient.get<ControlFault>('/control/fault', { params });

  return data;
};
