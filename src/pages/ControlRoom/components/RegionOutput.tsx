import { REGION_CI_COLOR } from '@/assets/geo/chungnamRegions';
import { formatNumber } from '@/utils/format';
import { getRegionHours } from '../utils/regionHours';
import styles from './RegionOutput.module.scss';

/**
 * 가장 낮은 지역이 남기는 길이.
 *
 * 발전시간은 같은 날 같은 하늘 아래 잰 값이라 지역끼리 크게 벌어지지 않는다 — 0 부터 그리면
 * 열다섯 줄이 모두 끝까지 차서 어디가 잘 냈는지가 막대로는 보이지 않는다. 가장 낮은 곳을
 * 이만큼으로 두고 그 위 차이를 펴면, 숫자를 읽기 전에 순서가 눈에 들어온다.
 */
const FLOOR = 0.18;

/**
 * 지역별 금일 발전시간 (SFR-004-09).
 *
 * 막대는 그 시·군의 충남 CI 색으로 긋는다 (2026-09-04 회의 · 조치사항 #8). 값의 크기를 뜻하지
 * 않는다 — 크기는 길이가 말한다. 같은 색이 지도에서도 그 시·군을 칠하고 있어, 「위 지도에서
 * 물든 곳이 이 표의 어느 줄인가」 를 눈이 색 하나로 잇는다.
 *
 * 발전량으로 견주면 개소 수가 곧 순위가 된다 — 계룡시(7개소)는 아무리 잘 내도 늘 맨 아래고,
 * 천안시(68개소)는 늘 맨 위다. 설비용량으로 나눈 발전시간이라야 큰 지역과 작은 지역이 같은
 * 눈금에 서서 「오늘 어디가 잘 냈나」 를 답한다 (2026-08-21 회의).
 *
 * 한 줄을 두 단으로 나눈다. 이름·값을 위에 두고 막대를 그 아래 칸 폭 전체로 깔면, 두 열로
 * 접어도 막대가 제 길이를 얻는다 — 한 줄에 셋을 나란히 두었을 때는 막대에 55px 밖에 남지
 * 않아 사실상 보이지 않았다.
 */
export function RegionOutput() {
  const { rows: ordered } = getRegionHours();
  const best = ordered[0]?.hours ?? 1;
  const worst = ordered[ordered.length - 1]?.hours ?? 0;
  const spread = Math.max(best - worst, 0.01);

  return (
    <ol className={styles.region}>
      {ordered.map((item, index) => {
        const ratio = FLOOR + (1 - FLOOR) * ((item.hours - worst) / spread);

        return (
          <li
            key={item.code}
            className={styles.region__row}
            data-lead={index === 0 ? '' : undefined}
            /* 지도에서 그 시·군이 입은 색 그대로 — 위 지도와 이 순위표가 색으로 이어진다 */
            style={{ '--row': REGION_CI_COLOR[item.name] } as React.CSSProperties}
          >
            <p className={styles.region__head}>
              <span className={styles.region__rank}>{index + 1}</span>
              <span className={styles.region__name}>{item.name}</span>
              <span className={styles.region__value}>
                {formatNumber(item.hours, 1)}
                <span className={styles.region__unit}>h</span>
              </span>
            </p>

            <span className={styles.region__track}>
              <span className={styles.region__bar} style={{ width: `${ratio * 100}%` }} />
            </span>
          </li>
        );
      })}
    </ol>
  );
}
