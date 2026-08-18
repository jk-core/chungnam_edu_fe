import { CountUp } from '@/components/common/CountUp';
import { countOperation, OPERATION_LABEL, OPERATION_ORDER, OPERATION_TONE } from '@/mocks/status';
import { formatCapacity, formatNumber, formatPercent } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from './OpsMetrics.module.scss';

interface OpsMetricsProps {
  schools: School[];
  /** 발전시간(h) */
  hours: number;
  /** 미수신 개소 */
  staleCount: number;
}

/**
 * 운영지표 — 발전시간·이용률·설비 가동 현황 (SFR-004-08).
 * 상태 분포는 색만이 아니라 수치도 함께 적어 색으로만 구분되지 않게 한다 (COR-003).
 */
export function OpsMetrics({ schools, hours, staleCount }: OpsMetricsProps) {
  const count = countOperation(schools);
  const total = schools.length || 1;
  const utilization = schools.reduce((sum, school) => sum + school.utilization, 0) / total;
  const capacity = formatCapacity(schools.reduce((sum, school) => sum + school.capacityKw, 0));
  const inverterCount = schools.reduce((sum, school) => sum + school.inverterCount, 0);
  // 지금 실제로 전기를 내고 있는 개소 — 상태 분포만으로는 한눈에 안 들어온다.
  const running = count.running + count.degraded;

  return (
    <div className={styles.ops}>
      <div className={styles.ops__top}>
        <div className={styles.ops__stat}>
          <span className={styles.ops__label}>발전시간</span>
          <span className={styles.ops__value}>
            <CountUp value={hours} fractionDigits={1} startOnView={false} />
            <span className={styles.ops__unit}>h</span>
          </span>
        </div>
        <div className={styles.ops__stat}>
          <span className={styles.ops__label}>평균 이용률</span>
          <span className={styles.ops__value}>{formatPercent(utilization, 1)}</span>
        </div>
        <div className={styles.ops__stat}>
          <span className={styles.ops__label}>미수신</span>
          <span className={staleCount > 0 ? styles.ops__valueAlert : styles.ops__value}>
            {formatNumber(staleCount)}
            <span className={styles.ops__unit}>개소</span>
          </span>
        </div>
        <div className={styles.ops__stat}>
          <span className={styles.ops__label}>발전 중</span>
          <span className={styles.ops__value}>
            {formatNumber(running)}
            <span className={styles.ops__unit}>/ {formatNumber(schools.length)}</span>
          </span>
        </div>
        <div className={styles.ops__stat}>
          <span className={styles.ops__label}>설비용량</span>
          <span className={styles.ops__value}>
            {capacity.value}
            <span className={styles.ops__unit}>{capacity.unit}</span>
          </span>
        </div>
        <div className={styles.ops__stat}>
          <span className={styles.ops__label}>인버터</span>
          <span className={styles.ops__value}>
            {formatNumber(inverterCount)}
            <span className={styles.ops__unit}>대</span>
          </span>
        </div>
      </div>

      {/* 상태 분포 — 한 줄 막대로 비율을 보이고 아래에 수치를 적는다 */}
      <div className={styles.ops__bar} role="img" aria-label={`설비 상태 분포, 전체 ${schools.length}개소`}>
        {OPERATION_ORDER.filter((status) => count[status] > 0).map((status) => (
          <span
            key={status}
            className={`${styles.ops__seg} ${styles[`ops__seg--${OPERATION_TONE[status]}`]}`}
            style={{ width: `${(count[status] / total) * 100}%` }}
          />
        ))}
      </div>

      <ul className={styles.ops__legend}>
        {OPERATION_ORDER.map((status) => (
          <li key={status} className={styles.ops__legendItem}>
            <span className={`${styles.ops__dot} ${styles[`ops__dot--${OPERATION_TONE[status]}`]}`} aria-hidden="true" />
            {OPERATION_LABEL[status]}
            <span className={styles.ops__legendValue}>{formatNumber(count[status])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
