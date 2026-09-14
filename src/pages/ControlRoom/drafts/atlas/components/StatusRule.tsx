import { countOperation, OPERATION_LABEL, OPERATION_ORDER, OPERATION_TONE } from '@/mocks/status';
import { formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from './StatusRule.module.scss';

/**
 * 설비 상태 분포 (SFR-004-08) — 아틀라스 판.
 *
 * A 의 `StatusMix` 와 담는 것은 같다(한 줄 분포 + 상태별 건수). 다만 이 시안은 색면보다 선으로
 * 값을 가르므로, 두꺼운 색막대 대신 가는 괘선 한 줄로 비율을 긋고 범례에는 네모 눈금을 세운다.
 * 색만으로 구분되지 않게 건수를 함께 적는 원칙은 그대로 지킨다 (COR-003).
 *
 * 개소가 0 인 상태는 괘선에서 빠지지만 범례에는 남는다 — 「지금 없다」 는 것도 읽을거리다.
 */
export function StatusRule({ plants }: { plants: School[] }) {
  const count = countOperation(plants);
  const total = plants.length || 1;

  return (
    <div className={styles.mix}>
      <div className={styles.mix__rule} role="img" aria-label={`설비 상태 분포, 전체 ${formatNumber(plants.length)}개소`}>
        {OPERATION_ORDER.filter((status) => count[status] > 0).map((status) => (
          <span
            key={status}
            className={styles.mix__seg}
            data-tone={OPERATION_TONE[status]}
            style={{ width: `${(count[status] / total) * 100}%` }}
          />
        ))}
      </div>

      <ul className={styles.mix__legend}>
        {OPERATION_ORDER.map((status) => (
          <li key={status} className={styles.mix__item}>
            <span className={styles.mix__tick} data-tone={OPERATION_TONE[status]} aria-hidden="true" />
            {OPERATION_LABEL[status]}
            <span className={styles.mix__value}>{formatNumber(count[status])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
