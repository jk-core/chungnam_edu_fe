import { countOperation, OPERATION_LABEL, OPERATION_ORDER, OPERATION_TONE } from '@/mocks/status';
import { formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import { TONE_VAR } from './status';
import styles from './StatusMeter.module.scss';
import type { CSSProperties } from 'react';

/**
 * 설비 상태 분포 (SFR-004-08) — 청사진 판.
 *
 * 면을 채우는 색막대(A) 대신 **치수선 하나에 눈금을 세운다**. 한 줄기 위를 상태별로 나누되
 * 나눔은 색 실선으로 긋고, 아래에 상태 이름과 수를 도면의 주기처럼 작게 벌려 적는다.
 * 색으로만 가르지 않도록(COR-003) 이름과 수를 늘 함께 둔다.
 */
export function StatusMeter({ plants }: { plants: School[] }) {
  const count = countOperation(plants);
  const total = plants.length || 1;

  return (
    <div className={styles.meter}>
      <div className={styles.meter__scale} role="img" aria-label={`설비 상태 분포, 전체 ${plants.length}개소`}>
        {OPERATION_ORDER.filter((status) => count[status] > 0).map((status) => (
          <span
            key={status}
            className={styles.meter__seg}
            style={{ '--seg': TONE_VAR[OPERATION_TONE[status]], width: `${(count[status] / total) * 100}%` } as CSSProperties}
          />
        ))}
      </div>

      <ul className={styles.meter__legend}>
        {OPERATION_ORDER.map((status) => (
          <li
            key={status}
            className={styles.meter__item}
            data-zero={count[status] === 0 ? '' : undefined}
            style={{ '--seg': TONE_VAR[OPERATION_TONE[status]] } as CSSProperties}
          >
            <span className={styles.meter__tick} aria-hidden="true" />
            <span className={styles.meter__name}>{OPERATION_LABEL[status]}</span>
            <span className={styles.meter__value}>{formatNumber(count[status])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
