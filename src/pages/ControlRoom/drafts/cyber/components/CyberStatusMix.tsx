import { countOperation, OPERATION_LABEL, OPERATION_ORDER, OPERATION_TONE } from '@/mocks/status';
import { formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from './CyberStatusMix.module.scss';

/**
 * 설비 상태 분포 (SFR-004-08).
 *
 * 시안 A 의 `StatusMix` 와 답하는 것은 같다 — 한 줄 막대로 비율을 보이고 수치를 함께 적어
 * 색만으로 갈리지 않게 한다 (COR-003). 그리기는 계측기의 결로 새로 짠다: 막대를 세그먼트
 * 눈금으로 끊고, 상태 색은 이 화면이 쥔 CSS 변수(`--ok`·`--caution`·`--critical`·`--offline`)로만 쓴다.
 *
 * 개소가 0 인 상태는 막대에서 빠지지만 범례에는 남는다 — 「지금 없다」 도 읽어야 할 값이다.
 */
export function CyberStatusMix({ plants }: { plants: School[] }) {
  const count = countOperation(plants);
  const total = plants.length || 1;

  return (
    <div className={styles.mix}>
      <div className={styles.mix__bar} role="img" aria-label={`설비 상태 분포, 전체 ${plants.length}개소`}>
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
          <li key={status} className={styles.mix__item} data-zero={count[status] === 0 ? '' : undefined}>
            <span className={styles.mix__dot} data-tone={OPERATION_TONE[status]} aria-hidden="true" />
            <span className={styles.mix__name}>{OPERATION_LABEL[status]}</span>
            <span className={styles.mix__value}>{formatNumber(count[status])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
