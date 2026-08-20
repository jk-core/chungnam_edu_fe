import dayjs from 'dayjs';
import { useMemo } from 'react';
import { TODAY } from '@/mocks/today';
import { useSnoozeMap } from '@/stores/faultActionStore';
import { summarize, useAlertFilters } from '../../hooks/useAlertFilters';

/** 조치 예정일이 오늘 이후로 남아 있으면 재워 둔 건으로 본다 (SFR-022-05). */
export function isSnoozed(until: string | undefined) {
  return until !== undefined && !dayjs(until).isBefore(TODAY, 'day');
}

/**
 * 미조치 알림 목록 (SFR-022-05).
 *
 * 조회 대상·기간은 전역 값을 따르므로 이 훅을 부르는 곳마다 같은 결과가 나온다.
 * 머리말과 목록이 각자 부르되 건수가 갈리지 않는다.
 */
export function usePendingAlerts() {
  const { results } = useAlertFilters({ forcePending: true });
  const snoozedUntil = useSnoozeMap();

  // 재운 건은 목록 아래로 내린다.
  const alerts = useMemo(
    () => [
      ...results.filter((alert) => !isSnoozed(snoozedUntil[alert.id])),
      ...results.filter((alert) => isSnoozed(snoozedUntil[alert.id])),
    ],
    [results, snoozedUntil],
  );

  return {
    alerts,
    snoozedUntil,
    snoozedCount: results.filter((alert) => isSnoozed(snoozedUntil[alert.id])).length,
    longestPending: summarize(results).longestPending,
  };
}
