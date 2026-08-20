import { formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from '../WarRoom.module.scss';

/** 아래 띠를 흐르는 순위 개수 */
const TICKER_TOP = 8;

/** 아래 — 오늘 잘한 곳. 급하지 않으니 흐르게 둔다. */
export function RankTicker({ plants }: { plants: School[] }) {
  const ranking = [...plants].sort((a, b) => b.todayKwh - a.todayKwh).slice(0, TICKER_TOP);

  return (
    <footer className={styles.ticker} aria-label="금일 실적 순위">
      <span className={styles.ticker__label}>금일 실적</span>
      <div className={styles.ticker__track}>
        <ul className={styles.ticker__list}>
          {ranking.map((plant, index) => (
            <li key={plant.id}>
              <em>{index + 1}</em>
              {plant.name}
              <b>{formatNumber(plant.todayKwh, 1)}kWh</b>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
