import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { motion } from 'motion/react';
import { Badge, SEVERITY_LABEL, SEVERITY_TONE } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ClockIcon } from '@/components/common/Icon';
import { DatePicker } from '@/components/common/DatePicker';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { Reveal } from '@/components/common/Reveal';
import { daysAhead, TODAY } from '@/mocks/today';
import { alertDurationMinutes } from '@/mocks/alerts';
import { cn } from '@/utils/cn';
import { formatDuration, formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useSnooze, useSnoozeMap, useUnsnooze } from '@/stores/faultActionStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { AlertRecord } from '@/interface/alert';
import styles from '../Alerts.module.scss';
import { summarize, useAlertFilters } from '../hooks/useAlertFilters';
import { AlertDetailModal } from '../components/AlertDetailModal';

/** 조치 예정일이 오늘 이후로 남아 있으면 재워 둔 건으로 본다 (SFR-022-05). */
function isSnoozed(until: string | undefined) {
  return until !== undefined && !dayjs(until).isBefore(TODAY, 'day');
}

/** 오래 열려 있을수록 위험하다. 24시간을 기준으로 색을 올린다. */
function urgencyOf(minutes: number) {
  if (minutes >= 24 * 60) return 'high' as const;
  if (minutes >= 8 * 60) return 'mid' as const;

  return 'low' as const;
}

function PendingView() {
  const { plantLabel: label } = usePlantScope();
  const { range, setRange, results } = useAlertFilters({ forcePending: true });
  const [selected, setSelected] = useState<AlertRecord | null>(null);
  const stats = summarize(results);

  const snoozedUntil = useSnoozeMap();
  const snooze = useSnooze();
  const unsnooze = useUnsnooze();

  /** 조치 예정일을 정하는 중인 알림 */
  const [snoozing, setSnoozing] = useState<AlertRecord | null>(null);
  const [plannedAt, setPlannedAt] = useState(() => new Date(daysAhead(3)));

  // 재운 건은 목록 아래로 내린다.
  const ordered = useMemo(
    () => [
      ...results.filter((alert) => !isSnoozed(snoozedUntil[alert.id])),
      ...results.filter((alert) => isSnoozed(snoozedUntil[alert.id])),
    ],
    [results, snoozedUntil],
  );

  const snoozedCount = results.filter((alert) => isSnoozed(snoozedUntil[alert.id])).length;

  const openSnooze = (alert: AlertRecord) => {
    setSnoozing(alert);
    setPlannedAt(new Date(daysAhead(3)));
  };

  const confirmSnooze = () => {
    if (!snoozing) return;

    const until = dayjs(plannedAt).format('YYYY-MM-DD');

    snooze(snoozing.id, until);
    toast.success(`${until} 까지 이 알림을 접어 둡니다.`);
    setSnoozing(null);
  };

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <DateRangePicker value={range} onChange={setRange} label="조회 기간" />
          <p className={styles.toolbar__note}>
            {stats.pending > 0
              ? `가장 오래된 건이 ${formatDuration(stats.longestPending)}째 열려 있습니다.`
              : '열려 있는 알림이 없습니다.'}
            {snoozedCount > 0 ? ` 조치 예정일을 정해 접어 둔 건 ${snoozedCount}건은 아래로 내렸습니다.` : ''}
          </p>
        </div>
        <p className={styles.toolbar__count}>{formatNumber(results.length)}건</p>
      </div>

      {results.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="미조치 알림이 없습니다"
            description={`${label}의 알림은 모두 조치되었습니다.`}
          />
        </Card>
      ) : (
        <ul className={styles.pendingList}>
          {ordered.map((alert, index) => {
            const minutes = alertDurationMinutes(alert);
            const urgency = urgencyOf(minutes);
            const asleep = isSnoozed(snoozedUntil[alert.id]);

            return (
              <motion.li
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.32, delay: Math.min(index, 10) * 0.04 }}
              >
                <div className={cn(styles.pendingRow, { [styles['pendingRow--snoozed']]: asleep })}>
                  <button
                    type="button"
                    className={cn(styles.pending, styles[`pending--${urgency}`])}
                    onClick={() => setSelected(alert)}
                  >
                    <span className={styles.pending__elapsed}>
                      <span className={styles.pending__elapsedValue}>{formatDuration(minutes)}</span>
                      <span className={styles.pending__elapsedLabel}>경과</span>
                    </span>

                    <span className={styles.pending__body}>
                      <span className={styles.pending__head}>
                        <Badge tone={SEVERITY_TONE[alert.severity]} withDot>
                          {SEVERITY_LABEL[alert.severity]}
                        </Badge>
                        <Badge tone="neutral">{alert.type}</Badge>
                        {alert.faultCode ? <Badge tone="brand">{alert.faultCode}</Badge> : null}
                      </span>
                      <span className={styles.pending__title}>{alert.title}</span>
                      <span className={styles.pending__meta}>
                        {alert.schoolName} · {alert.deviceName} · {alert.occurredAt}
                      </span>
                    </span>

                    <span className={styles.pending__more}>상세 보기</span>
                  </button>

                  <div className={styles.snooze}>
                    {asleep ? (
                      <>
                        <span className={styles.snooze__note}>조치 예정 {snoozedUntil[alert.id]}</span>
                        <Button size="sm" variant="ghost" onClick={() => unsnooze(alert.id)}>
                          다시 알림
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        iconLeft={<ClockIcon />}
                        onClick={() => openSnooze(alert)}
                      >
                        조치 예정일
                      </Button>
                    )}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}

      <Reveal delay={0.08}>
        <Card title="조치 순서" variant="outline">
          <ol className={styles.guide}>
            <li>
              <span className={styles.guide__step}>1</span>
              경과 시간이 24시간을 넘긴 긴급 건부터 확인합니다.
            </li>
            <li>
              <span className={styles.guide__step}>2</span>
              고장코드가 있으면 상세 화면에서 원인·조치 방법을 먼저 읽습니다.
            </li>
            <li>
              <span className={styles.guide__step}>3</span>
              현장 확인이 필요하면 AI진단 &gt; 점검 일정에 방문 일정을 등록합니다.
            </li>
          </ol>
        </Card>
      </Reveal>

      <Modal
        isOpen={snoozing !== null}
        onClose={() => setSnoozing(null)}
        title="조치 예정일 등록"
        description={
          snoozing
            ? `${snoozing.schoolName} · ${snoozing.deviceName} — 정한 날짜까지 이 알림을 목록 아래로 접어 둡니다.`
            : undefined
        }
        footer={(
          <>
            <Button variant="secondary" onClick={() => setSnoozing(null)}>
              취소
            </Button>
            <Button onClick={confirmSnooze}>등록</Button>
          </>
        )}
      >
        <div className={styles.snoozeForm}>
          <DatePicker value={plannedAt} onChange={setPlannedAt} granularity="day" label="조치 예정일" />
          <p className={styles.snooze__note}>
            예정일이 지나면 다시 위로 올라옵니다. 그 전에 조치를 마쳤다면 &lsquo;다시 알림&rsquo;으로 되돌릴 수
            있습니다.
          </p>
        </div>
      </Modal>

      <AlertDetailModal alert={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default PendingView;
