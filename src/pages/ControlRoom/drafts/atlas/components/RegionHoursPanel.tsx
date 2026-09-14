import { REGION_CI_COLOR } from '@/assets/geo/chungnamRegions';
import { formatNumber } from '@/utils/format';
import { getRegionHours } from '@/pages/ControlRoom/utils/regionHours';
import { Panel } from './Panel';
import styles from './RegionHoursPanel.module.scss';
import type { CSSProperties } from 'react';

/**
 * 지역별 발전시간 (SFR-004-09) — 아틀라스 판.
 *
 * A 는 열다섯 시·군을 한 줄씩 세우고 CI 색 막대로 순위를 그렸다. 이 시안의 자리는 360×240 으로
 * 세로가 짧아 열다섯 줄을 한 열로 세우면 줄이 눌린다. 그래서 **두 단 색인** 으로 바꾼다 —
 * 지도책 뒤의 지명 색인처럼 이름과 값 사이를 점선이 잇고, 이름 앞 네모에만 그 시·군의 CI 색을
 * 남긴다. 색은 크기를 뜻하지 않는다 — 크기는 값이 말하고 색은 옆 지도의 같은 시·군과 눈을 잇는다.
 *
 * 값(발전시간)과 목록은 A 와 같은 셈(`getRegionHours`)을 나눠 쓴다 — 제 판 안에서 다시 세면
 * 표제의 평균과 목록의 값이 어긋나는 날이 온다.
 */
export function RegionHoursPanel() {
  const { rows, average, count } = getRegionHours();

  return (
    <Panel
      title="지역별 발전시간"
      note={`${formatNumber(count)}개 지역 · 평균 ${formatNumber(average, 1)}h`}
    >
      <ol className={styles.index}>
        {rows.map((item, at) => (
          <li
            key={item.code}
            className={styles.index__row}
            data-lead={at === 0 ? '' : undefined}
            style={{ '--row': REGION_CI_COLOR[item.name] } as CSSProperties}
          >
            <span className={styles.index__rank}>{at + 1}</span>
            <span className={styles.index__swatch} aria-hidden="true" />
            <span className={styles.index__name}>{item.name}</span>
            <span className={styles.index__leader} aria-hidden="true" />
            <span className={styles.index__value}>
              {formatNumber(item.hours, 1)}<span className={styles.index__unit}>h</span>
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
