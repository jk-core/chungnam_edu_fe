import apiClient from '@/service';
import type { ChangeHistory, ChangeHistoryTargetType } from './type';

/** 대상 타입별 최근 변경 이력 (최신 10건) */
export const getChangeHistory = async (targetType: ChangeHistoryTargetType) => {
  const { data } = await apiClient.get<ChangeHistory[]>('/manage/changeHistory', {
    params: { targetType },
  });

  return data;
};
