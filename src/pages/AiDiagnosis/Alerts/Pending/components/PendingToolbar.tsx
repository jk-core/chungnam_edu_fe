import { DateRangePicker } from '@/components/common/DateRangePicker';
import { formatDuration, formatNumber } from '@/utils/format';
import { useAlertRange } from '@/stores/filterStore';
import styles from '../../Alerts.module.scss';
import { usePendingAlerts } from '../hooks/usePendingAlerts';

/** 조회 기간과 지금 얼마나 밀려 있는지 (SFR-022-05) */
export function PendingToolbar() {
  const [range, setRange] = useAlertRange();
  const { alerts, snoozedCount, longestPending } = usePendingAlerts();

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbar__left}>
        <DateRangePicker value={range} onChange={setRange} label="조회 기간" />
        <p className={styles.toolbar__note}>
          {alerts.length > 0
            ? `가장 오래된 건이 ${formatDuration(longestPending)}째 열려 있습니다.`
            : '열려 있는 알림이 없습니다.'}
          {snoozedCount > 0 ? ` 조치 예정일을 정해 접어 둔 건 ${snoozedCount}건은 아래로 내렸습니다.` : ''}
        </p>
      </div>
      <p className={styles.toolbar__count}>{formatNumber(alerts.length)}건</p>
    </div>
  );
}
