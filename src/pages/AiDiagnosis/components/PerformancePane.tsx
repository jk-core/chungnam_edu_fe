import { Sparkline } from '@/components/common/Sparkline';
import { cn } from '@/utils/cn';
import { formatDelta, formatNumber, formatPercent } from '@/utils/format';
import { formatShort } from '@/utils/date';
import type { PerformancePoint } from '@/interface/equipment';
import styles from '../AiDiagnosis.module.scss';

interface PerformancePaneProps {
  title: string;
  /** 지표 설명 한 줄 */
  hint: string;
  metric: 'pr' | 'cf';
  points: PerformancePoint[];
  /** 직전 같은 길이 기간의 평균 */
  previousAverage: number;
  /** 이 아래로 떨어지면 주의로 본다. */
  threshold: number;
}

/**
 * PR·CF 한 지표를 요약하는 패널.
 * 평균값과 직전 기간 대비 변화, 일별 추이, 최고·최저일을 한 덩어리로 보여 준다.
 */
export function PerformancePane({ title, hint, metric, points, previousAverage, threshold }: PerformancePaneProps) {
  if (points.length === 0) return null;

  const values = points.map((point) => point[metric]);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const best = points.reduce((top, point) => (point[metric] > top[metric] ? point : top), points[0]);
  const worst = points.reduce((low, point) => (point[metric] < low[metric] ? point : low), points[0]);
  const deltaPoints = (average - previousAverage) * 100;
  const isBelow = average < threshold;

  return (
    <div className={cn(styles.pane, { [styles['pane--warn']]: isBelow })}>
      <div className={styles.pane__head}>
        <div>
          <p className={styles.pane__title}>{title}</p>
          <p className={styles.pane__hint}>{hint}</p>
        </div>
        <span className={cn(styles.pane__delta, deltaPoints >= 0 ? styles.deltaUp : styles.deltaDown)}>
          {formatDelta(deltaPoints / 100)}p
        </span>
      </div>

      <p className={styles.pane__value}>
        {formatPercent(average, 1)}
        <span className={styles.pane__valueNote}>기간 평균</span>
      </p>

      <Sparkline
        values={values.map((value) => Math.round(value * 1000) / 10)}
        tone={isBelow ? 'critical' : 'brand'}
        width={260}
        height={52}
        className={styles.pane__spark}
      />

      <dl className={styles.pane__extremes}>
        <div>
          <dt>최고</dt>
          <dd>
            {formatShort(new Date(best.date))}
            <span className={styles.pane__extremeValue}>{formatPercent(best[metric], 1)}</span>
          </dd>
        </div>
        <div>
          <dt>최저</dt>
          <dd>
            {formatShort(new Date(worst.date))}
            <span className={cn(styles.pane__extremeValue, styles.deltaDown)}>{formatPercent(worst[metric], 1)}</span>
          </dd>
        </div>
      </dl>

      {isBelow ? (
        <p className={styles.pane__warning}>
          기준선 {formatPercent(threshold, 0)}에 못 미칩니다. 설비별 진단에서 원인 설비를 확인하세요.
        </p>
      ) : (
        <p className={styles.pane__ok}>기준선 {formatPercent(threshold, 0)} 이상으로 유지되고 있습니다.</p>
      )}

      <p className={styles.pane__foot}>
        실측 {formatNumber(points.reduce((sum, point) => sum + point.actualKwh, 0) / 1000, 1)}MWh · 기대{' '}
        {formatNumber(points.reduce((sum, point) => sum + point.expectedKwh, 0) / 1000, 1)}MWh
      </p>
    </div>
  );
}
