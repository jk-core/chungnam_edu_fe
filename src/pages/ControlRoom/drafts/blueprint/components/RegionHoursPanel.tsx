import { REGION_CI_COLOR } from '@/assets/geo/chungnamRegions';
import { formatNumber } from '@/utils/format';
import { getRegionHours } from '@/pages/ControlRoom/utils/regionHours';
import { Panel } from './Panel';
import styles from './RegionHoursPanel.module.scss';
import type { CSSProperties } from 'react';

/**
 * 가장 낮은 지역이 남기는 길이.
 * 발전시간은 같은 하늘 아래 잰 값이라 크게 벌어지지 않는다 — 0 부터 그리면 열다섯 줄이 모두
 * 끝까지 차서 순서가 막대로 보이지 않는다. 가장 낮은 곳을 이만큼으로 두고 그 위 차이를 편다.
 */
const FLOOR = 0.2;

/**
 * 지역별 발전시간 (SFR-004-09) — 청사진 판.
 *
 * 좁은 레일에 열다섯 시·군을 세워야 하므로 한 줄에 순위·이름·막대·값을 한 단으로 눕힌다.
 * 막대는 그 시·군의 충남 CI 색 실선으로 긋는다 — 옆(발전소 현황 지도)에서 물든 색과 같아, 두
 * 판을 색 하나로 잇는다. 값의 크기는 길이가 말하고 색은 시·군을 가르는 구실만 한다.
 */
export function RegionHoursPanel() {
  const { rows: ordered, average, count } = getRegionHours();
  const best = ordered[0]?.hours ?? 1;
  const worst = ordered[ordered.length - 1]?.hours ?? 0;
  const spread = Math.max(best - worst, 0.01);

  return (
    <Panel
      title="지역별 발전시간"
      note={`${formatNumber(count)}개 지역 · 평균 ${formatNumber(average, 1)}h`}
      grow
    >
      <ol className={styles.region}>
        {ordered.map((item, index) => {
          const ratio = FLOOR + (1 - FLOOR) * ((item.hours - worst) / spread);

          return (
            <li
              key={item.code}
              className={styles.region__row}
              style={{ '--row': REGION_CI_COLOR[item.name] } as CSSProperties}
            >
              <span className={styles.region__rank}>{index + 1}</span>
              <span className={styles.region__name}>{item.name}</span>
              <span className={styles.region__track}>
                <span className={styles.region__bar} style={{ width: `${ratio * 100}%` }} />
              </span>
              <span className={styles.region__value}>
                {formatNumber(item.hours, 1)}<span className={styles.region__unit}>h</span>
              </span>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
