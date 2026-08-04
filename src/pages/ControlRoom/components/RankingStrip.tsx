import { formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from './RankingStrip.module.scss';

/**
 * 보여 줄 순위.
 * 아래 장애 목록이 더 급한 정보라, 순위는 상위 몇 곳만 짚고 자리를 넘긴다.
 */
const TOP_N = 5;

interface RankingStripProps {
  /** 순위 대상 — 늘 전체 발전소를 받는다 */
  schools: School[];
}

/**
 * 학교별 발전 실적 순위 (SFR-004-09).
 * 1위 대비 비율을 막대로 그려 차이를 바로 읽히게 한다.
 */
export function RankingStrip({ schools }: RankingStripProps) {
  const ordered = [...schools].sort((a, b) => b.todayKwh - a.todayKwh);
  const best = ordered[0]?.todayKwh ?? 1;
  const ranked = ordered.slice(0, TOP_N);

  return (
    <ol className={styles.rank}>
      {ranked.map((school, index) => (
        <li key={school.id}>
          <span className={styles.rank__row}>
            <span className={styles.rank__order}>{index + 1}</span>
            <span className={styles.rank__body}>
              <span className={styles.rank__name}>{school.name}</span>
              <span className={styles.rank__track}>
                <span
                  className={styles.rank__bar}
                  style={{ width: `${Math.max(4, (school.todayKwh / Math.max(best, 1)) * 100)}%` }}
                />
              </span>
            </span>
            <span className={styles.rank__value}>{formatNumber(school.todayKwh)}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
