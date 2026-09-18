import { useQuery } from '@tanstack/react-query';
import type { ChangeLog } from '@/interface/changeLog';
import { getChangeHistory } from '@/service/changeHistory';
import type { ChangeHistoryTargetType } from '@/service/changeHistory/type';
import { queryKeys } from '@/service/queryKeys';
import { toChangeLogs } from '../mapChangeHistory';

const NONE: ChangeLog[] = [];

/** 관리 화면 하단 변경 이력 — 대상 타입별 최근 10건 */
export function useChangeHistory(targetType: ChangeHistoryTargetType) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.changeHistory.byTarget(targetType),
    queryFn: () => getChangeHistory(targetType),
    staleTime: 30_000,
    select: toChangeLogs,
  });

  return {
    rows: data ?? NONE,
    isLoading,
  };
}
