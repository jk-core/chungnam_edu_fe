import { countOperation, OPERATION_LABEL, OPERATION_ORDER, OPERATION_TONE } from '@/mocks/status';
import { formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from './StatusMix.module.scss';

/**
 * 설비 상태 분포 (SFR-004-08).
 *
 * 한 줄 막대로 비율을 보이고 아래에 수치를 적는다 — 색만으로 구분되지 않게 한다 (COR-003).
 * 개소가 0인 상태는 막대에서 빠지지만 범례에는 남는다. 「지금 없다」 는 것도 읽어야 할 정보다.
 */
export function StatusMix({ plants }: { plants: School[] }) {
  const count = countOperation(plants);
  const total = plants.length || 1;

  return (
    <div className={styles.mix}>
      <div className={styles.mix__bar} role="img" aria-label={`설비 상태 분포, 전체 ${plants.length}개소`}>
        {OPERATION_ORDER.filter((status) => count[status] > 0).map((status) => (
          <span
            key={status}
            className={`${styles.mix__seg} ${styles[`mix__seg--${OPERATION_TONE[status]}`]}`}
            style={{ width: `${(count[status] / total) * 100}%` }}
          />
        ))}
      </div>

      <ul className={styles.mix__legend}>
        {OPERATION_ORDER.map((status) => (
          <li key={status} className={styles.mix__item}>
            <span className={`${styles.mix__dot} ${styles[`mix__dot--${OPERATION_TONE[status]}`]}`} aria-hidden="true" />
            {OPERATION_LABEL[status]}
            <span className={styles.mix__value}>{formatNumber(count[status])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
