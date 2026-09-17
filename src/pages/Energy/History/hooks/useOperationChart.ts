import { useQuery } from '@tanstack/react-query';
import { getOperationHistoryChart } from '@/service/operationHistory';
import { queryKeys } from '@/service/queryKeys';

/**
 * 하루치 추이 (SFR-010-04).
 *
 * 표와 달리 쪽을 나누지 않는다 — 하루 모양을 보는 자리라 전량이 한 번에 와야 선이 이어진다.
 * 응답은 출력 전력·전압·전류 셋뿐이고 상별(R/S/T) 값은 없다.
 */
export function useOperationChart(cid: number | null, targetDate: string) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.operationHistory.chart(cid, targetDate),
    queryFn: () => getOperationHistoryChart({ cid: cid ?? 0, targetDate }),
    enabled: cid !== null,
  });

  return { rows: data ?? [], isLoading };
}
