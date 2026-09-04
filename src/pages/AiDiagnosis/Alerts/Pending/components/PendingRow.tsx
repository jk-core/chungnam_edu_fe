import { Badge } from '@/components/common/Badge';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { Button } from '@/components/common/Button';
import { ClockIcon } from '@/components/common/Icon';
import { alertDurationMinutes } from '@/mocks/alerts';
import { cn } from '@/utils/cn';
import { formatDuration } from '@/utils/format';
import type { AlertRecord } from '@/interface/alert';
import styles from '../../Alerts.module.scss';

interface PendingRowProps {
  alert: AlertRecord;
  /** 재워 둔 건이면 조치 예정일, 아니면 undefined */
  snoozedUntil?: string;
  onOpen: () => void;
  onWake: () => void;
}

/** 오래 열려 있을수록 위험하다. 24시간을 기준으로 색을 올린다. */
function urgencyOf(minutes: number) {
  if (minutes >= 24 * 60) return 'high' as const;
  if (minutes >= 8 * 60) return 'mid' as const;

  return 'low' as const;
}

/** 미조치 알림 한 건 (SFR-022-05) */
export function PendingRow({ alert, snoozedUntil, onOpen, onWake }: PendingRowProps) {
  const minutes = alertDurationMinutes(alert);
  const asleep = snoozedUntil !== undefined;

  return (
    <div className={cn(styles.pendingRow, { [styles['pendingRow--snoozed']]: asleep })}>
      <button type="button" className={cn(styles.pending, styles[`pending--${urgencyOf(minutes)}`])} onClick={onOpen}>
        <span className={styles.pending__elapsed}>
          <span className={styles.pending__elapsedValue}>{formatDuration(minutes)}</span>
          <span className={styles.pending__elapsedLabel}>경과</span>
        </span>

        <span className={styles.pending__body}>
          <span className={styles.pending__head}>
            <Badge tone={OPERATION_TONE[alert.status]} withDot>
              {OPERATION_LABEL[alert.status]}
            </Badge>
            {alert.faultCode ? <Badge tone="brand">{alert.faultCode}</Badge> : null}
          </span>
          <span className={styles.pending__title}>{alert.title}</span>
          <span className={styles.pending__meta}>
            {alert.schoolName} · {alert.deviceName} · {alert.occurredAt}
          </span>
        </span>

        <span className={styles.pending__more}>상세 보기</span>
      </button>

      {/* 예정일을 잡는 것은 상세 창의 조치 폼이 한다. 여기는 재워 둔 것을 되돌리는 자리만 남긴다. */}
      <div className={styles.snooze}>
        {asleep ? (
          <>
            <span className={styles.snooze__note}>
              <ClockIcon width={13} height={13} aria-hidden />
              조치 예정 {snoozedUntil}
            </span>
            <Button size="sm" variant="ghost" onClick={onWake}>다시 알림</Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
