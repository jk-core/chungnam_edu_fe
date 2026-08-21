import { REGIONS } from '@/mocks/regions';
import { formatNumber } from '@/utils/format';
import styles from './RegionOutput.module.scss';

/**
 * 시·군별 금일 발전량 (SFR-004-09).
 *
 * 지도는 어디가 아픈지를 답하고 이 판은 어디가 얼마나 내는지를 답한다. 발전량 순으로 세우고
 * 1위 대비 길이로 막대를 그려, 천안시 한 곳이 도 전체의 얼마쯤인지가 숫자를 읽기 전에 보인다.
 *
 * 수치는 막대 안에 얹는다. 이름·막대·수치를 각각 한 칸씩 나눠 주면 두 열로 접었을 때
 * 셋 다 좁아져 막대는 뭉개지고 숫자는 자리를 다툰다.
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
            {/* 막대와 수치를 한 덩이로 둔다 — 따로 세우면 둘 다 좁아져 읽기 어렵다 */}
            <span className={styles.region__track}>
              <span
                className={styles.region__bar}
                style={{ width: `${Math.max(3, (item.todayKwh / Math.max(best, 1)) * 100)}%` }}
              />
              <span className={styles.region__value}>{formatNumber(item.todayKwh)}</span>
            </span>
          </li>
        ))}
      </ol>

      <p className={styles.region__foot}>
        합계 {formatNumber(total)} kWh · {formatNumber(ordered.length)}개 시·군
      </p>
    </div>
  );
}
