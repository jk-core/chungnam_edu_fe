import { REGION_CI_COLOR } from '@/assets/geo/chungnamRegions';
import { formatNumber } from '@/utils/format';
import { getRegionHours } from '@/pages/ControlRoom/utils/regionHours';
import { CyberPanel } from './CyberPanel';
import styles from './RegionBars.module.scss';
import type { CSSProperties } from 'react';

/**
 * 가장 낮은 지역이 남기는 길이.
 * 발전시간은 같은 날 같은 하늘 아래 잰 값이라 지역끼리 크게 벌어지지 않는다 — 0 부터 그리면
 * 열다섯 줄이 모두 끝까지 차서 순서가 막대로는 보이지 않는다. 가장 낮은 곳을 이만큼으로 두고
 * 그 위 차이를 펴면, 숫자를 읽기 전에 순서가 눈에 들어온다.
 */
const FLOOR = 0.2;

/**
 * 지역별 금일 발전시간 (SFR-004-09).
 *
 * 담는 것은 시안 A 의 `RegionOutput` 과 같다 — 열다섯 시·군의 금일 발전시간, 순위, 시·군 CI
 * 색 막대. 제목 줄에 지역 수·평균.
 *
 * A 는 한 줄을 두 단(이름·값 / 막대)으로 나눠 썼지만, 이 판은 300×220 에 열다섯 줄을 세워야
 * 하므로 그럴 높이가 없다. 한 줄을 한 골로 눕혀 순위·이름·막대·값을 가로로 정렬한다 — 막대를
 * 행의 몸통으로 쓰고 값을 그 오른쪽에 고정폭으로 세우면, 낮은 줄에서도 눈금이 접히지 않는다.
 * 막대 색은 그 시·군의 충남 CI 색이라, 위 지도판에서 물든 면과 색 하나로 이어진다.
 */
export function RegionBars() {
  // 목록과 제목 줄이 같은 셈을 나눠 쓴다 — 각자 세면 평균과 목록의 값이 어긋나는 날이 온다.
  const { rows, average, count } = getRegionHours();
  const best = rows[0]?.hours ?? 1;
  const worst = rows[rows.length - 1]?.hours ?? 0;
  const spread = Math.max(best - worst, 0.01);

  return (
    <CyberPanel
      title="지역별 발전시간"
      note={`${formatNumber(count)}개 지역 · 평균 ${formatNumber(average, 1)}h`}
    >
      <ol className={styles.bars}>
        {rows.map((item, index) => {
          const ratio = FLOOR + (1 - FLOOR) * ((item.hours - worst) / spread);

          return (
            <li
              key={item.code}
              className={styles.bars__row}
              data-lead={index === 0 ? '' : undefined}
              style={{ '--row': REGION_CI_COLOR[item.name] } as CSSProperties}
            >
              <span className={styles.bars__rank}>{index + 1}</span>
              <span className={styles.bars__name}>{item.name}</span>
              <span className={styles.bars__track}>
                <span className={styles.bars__fill} style={{ width: `${ratio * 100}%` }} />
              </span>
              <span className={styles.bars__value}>
                {formatNumber(item.hours, 1)}
                <span className={styles.bars__unit}>h</span>
              </span>
            </li>
          );
        })}
      </ol>
    </CyberPanel>
  );
}
