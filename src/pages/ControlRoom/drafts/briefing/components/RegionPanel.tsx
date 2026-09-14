import { REGION_CI_COLOR } from '@/assets/geo/chungnamRegions';
import { formatNumber } from '@/utils/format';
import { getRegionHours } from '@/pages/ControlRoom/utils/regionHours';
import { Panel } from './Panel';
import styles from './RegionPanel.module.scss';
import type { CSSProperties } from 'react';

/**
 * 가장 낮은 지역이 남기는 막대 길이.
 *
 * 발전시간은 같은 날 같은 하늘 아래 잰 값이라 지역끼리 크게 벌어지지 않는다 — 0 부터 그리면
 * 열다섯 줄이 모두 끝까지 차 순서가 막대로 보이지 않는다. 가장 낮은 곳을 이만큼으로 두고 그 위
 * 차이를 편다.
 */
const FLOOR = 0.2;

/**
 * 지역별 금일 발전시간 (SFR-004-09).
 *
 * 좁고 낮은 칸이라 A 처럼 한 줄에 두 단(이름·값 / 막대)을 쓰면 열다섯 줄이 서른 줄이 되어
 * 넘친다. 여기서는 한 줄에 순위·이름·막대·값을 한 단으로 눕히고 두 열로 접어, 열다섯 시·군이
 * 여덟 줄 안에 든다. 막대는 그 시·군의 충남 CI 색으로 긋는다 (2026-09-04 회의 · 조치사항 #8) —
 * 같은 색이 관내 지도에서도 그 시·군을 칠하고 있어 눈이 색 하나로 두 판을 잇는다.
 *
 * 발전량이 아니라 설비용량으로 나눈 발전시간으로 줄을 세운다 — 발전량이면 개소 수가 곧 순위가
 * 되어 천안시(68개소)가 늘 위, 계룡시(7개소)가 늘 아래다. 발전시간이라야 큰 지역과 작은 지역이
 * 같은 눈금에 서서 「오늘 어디가 잘 냈나」 를 답한다 (2026-08-21 회의).
 */
export function RegionPanel() {
  // 목록과 제목 줄이 같은 셈을 나눠 쓴다 — 각자 세면 평균과 목록의 값이 어긋나는 날이 온다.
  const { rows: ordered, average, count } = getRegionHours();
  const best = ordered[0]?.hours ?? 1;
  const worst = ordered[ordered.length - 1]?.hours ?? 0;
  const spread = Math.max(best - worst, 0.01);

  return (
    <Panel
      title="지역별 발전시간"
      note={`${formatNumber(count)}개 지역 · 평균 ${formatNumber(average, 1)}h`}
    >
      <ol className={styles.region}>
        {ordered.map((item, index) => {
          const ratio = FLOOR + (1 - FLOOR) * ((item.hours - worst) / spread);

          return (
            <li
              key={item.code}
              className={styles.region__row}
              data-lead={index === 0 ? '' : undefined}
              /* 관내 지도에서 그 시·군이 입은 색 그대로 — 두 판을 색으로 잇는다 */
              style={{ '--row': REGION_CI_COLOR[item.name] } as CSSProperties}
            >
              <span className={styles.region__rank}>{index + 1}</span>
              <span className={styles.region__name}>{item.name}</span>
              <span className={styles.region__track}>
                <span className={styles.region__bar} style={{ width: `${ratio * 100}%` }} />
              </span>
              <span className={styles.region__value}>
                {formatNumber(item.hours, 1)}
                <span className={styles.region__unit}>h</span>
              </span>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
