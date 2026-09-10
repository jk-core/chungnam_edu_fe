import apiClient, { FILE_TIMEOUT } from '@/service';
import type { PagingResponse } from '@/service/common';
import type {
  AlarmActionParams,
  AlarmDetail,
  AlarmFilterParams,
  AlarmOverview,
  AlarmPage,
  AlarmPageParams,
  AlarmRule,
  AlarmRuleParams,
  AlarmTimeline,
  AlarmTimelineParams,
  AlarmUnresolved,
  AlarmUnresolvedParams,
} from './type';

/** 알림이력 API */
export const getAlarmPage = async (params: AlarmPageParams) => {
  const { data } = await apiClient.get<PagingResponse<AlarmPage>>('/alarm/page', { params });

  return data;
};

export const getAlarmOverview = async (params: AlarmFilterParams) => {
  const { data } = await apiClient.get<AlarmOverview>('/alarm/overview', { params });

  return data;
};

export const getAlarmDetail = async (alarmId: number) => {
  const { data } = await apiClient.get<AlarmDetail>('/alarm/detail', { params: { alarmId } });

  return data;
};

export const putAlarmAction = (data: AlarmActionParams) => apiClient.put('/alarm/detail', data);

export const getAlarmExcel = async (params: AlarmFilterParams) => {
  const { data } = await apiClient.get<Blob>('/alarm/excel', {
    params,
    responseType: 'blob',
    timeout: FILE_TIMEOUT,
  });

  return data;
};

export const getAlarmTimeline = async (params: AlarmTimelineParams) => {
  const { data } = await apiClient.get<AlarmTimeline[]>('/alarm/timeline', { params });

  return data;
};

export const getAlarmRuleList = async () => {
  const { data } = await apiClient.get<AlarmRule[]>('/alarm/rule/list');

  return data;
};

export const putAlarmRule = (data: AlarmRuleParams) => apiClient.put('/alarm/rule', data);

/** 헤더 알림 종 패널 */
export const getAlarmUnresolved = async (params: AlarmUnresolvedParams) => {
  const { data } = await apiClient.get<AlarmUnresolved>('/alarm/unresolved', { params });

  return data;
};
