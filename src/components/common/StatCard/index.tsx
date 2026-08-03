import { CountUp } from '@/components/common/CountUp';
import { cn } from '@/utils/cn';
import { formatDelta } from '@/utils/format';
import styles from './StatCard.module.scss';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  unit: string;
  fractionDigits?: number;
  /** 전기 대비 증감률(0.052 = +5.2%) */
  delta?: number;
  deltaLabel?: string;
  icon?: ReactNode;
  /** 값을 solar 액센트로 강조할지 — 발전량 지표에만 쓴다. */
  accent?: boolean;
  /** 0~1. 지정하면 하단에 진행 막대를 그린다. */
  meter?: number;
  meterLabel?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  unit,
  fractionDigits = 0,
  delta,
  deltaLabel,
  icon,
  accent = false,
  meter,
  meterLabel,
  className,
}: StatCardProps) {
  const deltaTone = delta === undefined ? undefined : delta >= 0 ? 'up' : 'down';

  return (
    <div className={cn(styles.stat, { [styles['stat--accent']]: accent, [className ?? '']: !!className })}>
      <div className={styles.stat__top}>
        <p className={styles.stat__label}>{label}</p>
        {icon ? <span className={styles.stat__icon}>{icon}</span> : null}
      </div>

      <p className={styles.stat__value}>
        <CountUp value={value} fractionDigits={fractionDigits} />
        <span className={styles.stat__unit}>{unit}</span>
      </p>

      {delta !== undefined ? (
        <p className={cn(styles.stat__delta, styles[`stat__delta--${deltaTone}`])}>
          <span className={styles.stat__deltaValue}>{formatDelta(delta)}</span>
          {deltaLabel ? <span className={styles.stat__deltaLabel}>{deltaLabel}</span> : null}
        </p>
      ) : null}

      {meter !== undefined ? (
        <div className={styles.stat__meter}>
          <div className={styles.stat__meterTrack}>
            <div className={styles.stat__meterFill} style={{ width: `${Math.min(meter, 1) * 100}%` }} />
          </div>
          {meterLabel ? <span className={styles.stat__meterLabel}>{meterLabel}</span> : null}
        </div>
      ) : meterLabel ? (
        // 막대 없이 설명만 붙일 수도 있다. 이 경우 아래쪽에 각주처럼 남긴다.
        <p className={cn(styles.stat__meterLabel, styles.stat__note)}>{meterLabel}</p>
      ) : null}
    </div>
  );
}
