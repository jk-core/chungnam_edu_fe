import dayjs from 'dayjs';
import { motion } from 'motion/react';
import { alertDurationMinutes } from '@/mocks/alerts';
import { cn } from '@/utils/cn';
import { formatDuration } from '@/utils/format';
import type { AlertRecord } from '@/interface/alert';
import styles from '../Alerts.module.scss';

interface AlertTimelineProps {
  alerts: AlertRecord[];
  start: Date;
  end: Date;
  onSelect: (alert: AlertRecord) => void;
}

/**
 * 알림이 열려 있던 구간을 시간축 위 막대로 그린다.
 * 표로는 잘 안 보이는 "같은 시기에 몰린 알림"이 한눈에 드러난다.
 */
export function AlertTimeline({ alerts, start, end, onSelect }: AlertTimelineProps) {
  const from = dayjs(start).startOf('day');
  const to = dayjs(end).endOf('day');
  const totalMinutes = Math.max(1, to.diff(from, 'minute'));

  // 축 눈금 — 기간 길이에 따라 5~6개만 찍는다.
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount + 1 }, (_, index) => {
    const at = from.add((totalMinutes / tickCount) * index, 'minute');

    return { key: index, label: at.format('M/D'), left: (index / tickCount) * 100 };
  });

  return (
    <div className={styles.gantt}>
      <div className={styles.gantt__axis} aria-hidden="true">
        {ticks.map((tick) => (
          <span key={tick.key} className={styles.gantt__tick} style={{ left: `${tick.left}%` }}>
            {tick.label}
          </span>
        ))}
      </div>

      <ul className={styles.gantt__rows}>
        {alerts.map((alert, index) => {
          const startAt = dayjs(alert.occurredAt);
          const endAt = alert.resolvedAt ? dayjs(alert.resolvedAt) : to;
          const left = Math.max(0, (startAt.diff(from, 'minute') / totalMinutes) * 100);
          const width = Math.max(0.6, (endAt.diff(startAt, 'minute') / totalMinutes) * 100);

          return (
            <li key={alert.id} className={styles.gantt__row}>
              <span className={styles.gantt__label}>
                <span className={styles.gantt__school}>{alert.schoolName}</span>
                <span className={styles.gantt__title}>{alert.title}</span>
              </span>

              <span className={styles.gantt__track}>
                {ticks.map((tick) => (
                  <span key={tick.key} className={styles.gantt__grid} style={{ left: `${tick.left}%` }} />
                ))}
                <motion.button
                  type="button"
                  className={cn(styles.gantt__bar, styles[`gantt__bar--${alert.severity}`], {
                    [styles['gantt__bar--pending']]: !alert.handled,
                  })}
                  style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
                  onClick={() => onSelect(alert)}
                  title={`${alert.title} · ${formatDuration(alertDurationMinutes(alert))}${alert.handled ? '' : ' · 진행 중'}`}
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: Math.min(index, 12) * 0.03, ease: [0.22, 0.68, 0.32, 1] }}
                />
              </span>
            </li>
          );
        })}
      </ul>

      <p className={styles.gantt__legend}>
        막대는 알림이 열려 있던 구간입니다. 오른쪽 끝까지 이어진 막대는 아직 조치되지 않은 건입니다.
      </p>
    </div>
  );
}
