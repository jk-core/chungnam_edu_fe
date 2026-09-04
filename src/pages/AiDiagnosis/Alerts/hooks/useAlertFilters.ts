import { useMemo, useState } from 'react';
import { ALERT_RECORDS, alertDurationMinutes } from '@/mocks/alerts';
import { isWithinRange } from '@/utils/date';
import { useAlertRange } from '@/stores/filterStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { AlertRecord } from '@/interface/alert';
import type { OperationStatus } from '@/interface/status';

export type HandledFilter = 'all' | 'handled' | 'pending';
export type SortKey = 'recent' | 'oldest' | 'longest';

export interface AlertFilterState {
  status: OperationStatus | 'all';
  handled: HandledFilter;
  sort: SortKey;
}

const INITIAL: AlertFilterState = { status: 'all', handled: 'all', sort: 'recent' };

/**
 * 알림 목록 필터. 발전소 선택과 조회 기간은 전역 값을 따르고,
 * 구분·조치여부·정렬만 화면 안에서 관리한다.
 */
export function useAlertFilters(options: { forcePending?: boolean } = {}) {
  const { plant } = usePlantScope();
  const [range, setRange] = useAlertRange();
  const [filters, setFilters] = useState<AlertFilterState>(
    options.forcePending ? { ...INITIAL, handled: 'pending', sort: 'longest' } : INITIAL,
  );

  const results = useMemo(() => {
    const handled = options.forcePending ? 'pending' : filters.handled;

    const filtered = ALERT_RECORDS.filter((alert) => {
      if (plant && alert.schoolId !== plant.id) return false;
      if (!isWithinRange(alert.occurredAt, range.start, range.end)) return false;
      if (filters.status !== 'all' && alert.status !== filters.status) return false;
      if (handled === 'handled' && !alert.handled) return false;
      if (handled === 'pending' && alert.handled) return false;

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (filters.sort === 'oldest') return a.occurredAt < b.occurredAt ? -1 : 1;
      if (filters.sort === 'longest') return alertDurationMinutes(b) - alertDurationMinutes(a);

      return a.occurredAt < b.occurredAt ? 1 : -1;
    });
  }, [plant, range.start, range.end, filters, options.forcePending]);

  const isDirty = filters.status !== 'all' || filters.handled !== 'all';

  return {
    range,
    setRange,
    filters,
    setFilters,
    results,
    isDirty,
    reset: () => setFilters(INITIAL),
  };
}

/** 목록 요약 지표 */
export function summarize(alerts: AlertRecord[]) {
  const pending = alerts.filter((alert) => !alert.handled);
  const handled = alerts.filter((alert) => alert.handled);
  const manual = handled.filter((alert) => alert.manual);
  const averageMinutes = handled.length > 0
    ? handled.reduce((sum, alert) => sum + alertDurationMinutes(alert), 0) / handled.length
    : 0;
  const longestPending = pending.reduce((max, alert) => Math.max(max, alertDurationMinutes(alert)), 0);

  return {
    total: alerts.length,
    pending: pending.length,
    pendingCritical: pending.filter((alert) => alert.status === 'fault').length,
    handledRate: alerts.length > 0 ? handled.length / alerts.length : 0,
    averageMinutes,
    manualCount: manual.length,
    longestPending,
  };
}
