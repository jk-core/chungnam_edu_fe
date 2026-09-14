import { countOperation, OPERATION_LABEL, OPERATION_ORDER, OPERATION_TONE } from '@/mocks/status';
import { formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from './StatusBar.module.scss';

/**
 * 설비 상태 분포 (SFR-004-08).
 *
 * A 의 StatusMix 와 답은 같다 — 한 줄 막대로 비율을 보이고 범례에 이름과 수를 적는다. 색만으로
 * 갈리지 않게 이름을 함께 둔다 (COR-003). 개소가 0 인 상태는 막대에서 빠지되 범례에는 남긴다 —
 * 「지금 없다」 도 읽어야 할 값이다.
 *
 * 브리핑 보드에서 두 판(관내 발전소 현황·장애 발생 현황)이 나눠 쓰므로 이 폴더 안에 새로 둔다.
 * 다섯 상태의 색은 BEM 수식어를 다섯 벌 늘어놓는 대신 `data-tone` 한 축으로 가른다.
 */
export function StatusBar({ plants }: { plants: School[] }) {
  const count = countOperation(plants);
  const total = plants.length || 1;

  return (
    <div className={styles.status}>
      <div className={styles.status__bar} role="img" aria-label={`설비 상태 분포, 전체 ${plants.length}개소`}>
        {OPERATION_ORDER.filter((status) => count[status] > 0).map((status) => (
          <span
            key={status}
            className={styles.status__seg}
            data-tone={OPERATION_TONE[status]}
            style={{ width: `${(count[status] / total) * 100}%` }}
          />
        ))}
      </div>

      <ul className={styles.status__legend}>
        {OPERATION_ORDER.map((status) => (
          <li key={status} className={styles.status__item}>
            <span className={styles.status__dot} data-tone={OPERATION_TONE[status]} aria-hidden="true" />
            {OPERATION_LABEL[status]}
            <span className={styles.status__value}>{formatNumber(count[status])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
