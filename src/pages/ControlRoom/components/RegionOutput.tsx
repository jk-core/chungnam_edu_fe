import { REGIONS } from '@/mocks/regions';
import { formatNumber } from '@/utils/format';
import styles from './RegionOutput.module.scss';

/** 채움이 이만큼 넘으면 숫자가 면 위에 올라선다 — 그때부터 글자색을 뒤집는다 */
const COVER_RATIO = 0.72;

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
 * 발전량으로 견주면 개소 수가 곧 순위가 된다 — 계룡시(7개소)는 아무리 잘 내도 늘 맨 아래고,
 * 천안시(68개소)는 늘 맨 위다. 설비용량으로 나눈 발전시간이라야 큰 지역과 작은 지역이 같은
 * 눈금에 서서 「오늘 어디가 잘 냈나」 를 답한다 (2026-08-21 회의).
 *
 * 수치는 막대 안에 얹는다. 이름·막대·수치를 각각 한 칸씩 나눠 주면 두 열로 접었을 때
 * 셋 다 좁아져 막대는 뭉개지고 숫자는 자리를 다툰다.
 */
export function RegionOutput() {
  const ordered = [...REGIONS]
    .map((region) => ({ ...region, hours: region.capacityKw > 0 ? region.todayKwh / region.capacityKw : 0 }))
    .sort((a, b) => b.hours - a.hours);
  const best = ordered[0]?.hours ?? 1;
  const worst = ordered[ordered.length - 1]?.hours ?? 0;
  const spread = Math.max(best - worst, 0.01);

  return (
    <div className={styles.region}>
      <ol className={styles.region__list}>
        {ordered.map((item, index) => {
          const ratio = FLOOR + (1 - FLOOR) * ((item.hours - worst) / spread);

          return (
            <li key={item.code} className={styles.region__row} data-lead={index === 0 ? '' : undefined}>
              <span className={styles.region__rank}>{index + 1}</span>
              <span className={styles.region__name}>{item.name}</span>
              {/*
                막대와 수치를 한 덩이로 둔다. 채움이 숫자 자리까지 닿으면 글자색을 뒤집어,
                짧은 막대에서도 긴 막대에서도 숫자가 묻히지 않는다.
              */}
              <span className={styles.region__track} data-over={ratio >= COVER_RATIO ? '' : undefined}>
                <span className={styles.region__bar} style={{ width: `${ratio * 100}%` }} />
                <span className={styles.region__value}>
                  {formatNumber(item.hours, 1)}
                  <span className={styles.region__unit}>h</span>
                </span>
              </span>
            </li>
          );
        })}
      </ol>

    </div>
  );
}
