import styles from '../../Alerts.module.scss';
import { summarize, useAlertFilters } from '../../hooks/useAlertFilters';
import { AlertFilterCard } from './AlertFilterCard';
import { AlertHistoryCard } from './AlertHistoryCard';
import { AlertSummary } from './AlertSummary';
import type { AlertFilterState } from '../../hooks/useAlertFilters';

/**
 * 알림 이력 조회 (SFR-022-01~03).
 *
 * 요약·조회 조건·이력이 모두 같은 한 벌을 봐야 하므로 거르는 일은 여기서 한 번만 한다.
 * 조건마다 따로 세면 같은 화면 안에서 건수가 갈린다.
 */
export function AlertListBoard() {
  const { filters, setFilters, results, isDirty, reset } = useAlertFilters();
  const stats = summarize(results);

  const change = (next: Partial<AlertFilterState>) => setFilters((prev) => ({ ...prev, ...next }));

  return (
    <div className={styles.tab}>
      <AlertSummary stats={stats} />
      <AlertFilterCard filters={filters} onChange={change} isDirty={isDirty} onReset={reset} />
      <AlertHistoryCard rows={results} stats={stats} />
    </div>
  );
}
