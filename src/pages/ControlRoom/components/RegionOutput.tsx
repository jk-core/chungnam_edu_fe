import { REGIONS } from '@/mocks/regions';
import { formatNumber } from '@/utils/format';
import styles from './RegionOutput.module.scss';

/**
 * 시·군별 금일 발전량 (SFR-004-09).
 *
 * 지도는 어디가 아픈지를 답하고 이 판은 어디가 얼마나 내는지를 답한다. 발전량 순으로 세우고
 * 1위 대비 길이로 막대를 그려, 천안시 한 곳이 도 전체의 얼마쯤인지가 숫자를 읽기 전에 보인다.
 */
export function RegionOutput() {
  const ordered = [...REGIONS].sort((a, b) => b.todayKwh - a.todayKwh);
  const best = ordered[0]?.todayKwh ?? 1;
  const total = ordered.reduce((sum, region) => sum + region.todayKwh, 0);

  return (
    <div className={styles.region}>
      <ol className={styles.region__list}>
        {ordered.map((item) => (
          <li key={item.code} className={styles.region__row}>
            <span className={styles.region__name}>{item.name}</span>
            <span className={styles.region__track}>
              <span
                className={styles.region__bar}
                style={{ width: `${Math.max(3, (item.todayKwh / Math.max(best, 1)) * 100)}%` }}
              />
            </span>
            <span className={styles.region__value}>{formatNumber(item.todayKwh)}</span>
          </li>
        ))}
      </ol>

      <p className={styles.region__foot}>
        합계 {formatNumber(total)} kWh · {formatNumber(ordered.length)}개 시·군
      </p>
    </div>
  );
}
