import { REGIONS } from '@/mocks/regions';
import { formatNumber } from '@/utils/format';
import styles from './RegionOutput.module.scss';

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
  // 관내 전체의 발전시간 — 지역 평균이 아니라 전체 발전량을 전체 설비용량으로 나눈 값이다.
  const totalKwh = ordered.reduce((sum, region) => sum + region.todayKwh, 0);
  const totalCapacity = ordered.reduce((sum, region) => sum + region.capacityKw, 0);
  const totalHours = totalCapacity > 0 ? totalKwh / totalCapacity : 0;

  return (
    <div className={styles.region}>
      <ol className={styles.region__list}>
        {ordered.map((item, index) => (
          <li key={item.code} className={styles.region__row} data-lead={index === 0 ? '' : undefined}>
            <span className={styles.region__rank}>{index + 1}</span>
            <span className={styles.region__name}>{item.name}</span>
            {/* 막대와 수치를 한 덩이로 둔다 — 따로 세우면 둘 다 좁아져 읽기 어렵다 */}
            <span className={styles.region__track}>
              <span
                className={styles.region__bar}
                style={{ width: `${Math.max(4, (item.hours / Math.max(best, 0.01)) * 100)}%` }}
              />
              <span className={styles.region__value}>
                {formatNumber(item.hours, 1)}
                <span className={styles.region__unit}>h</span>
              </span>
            </span>
          </li>
        ))}
      </ol>

      <p className={styles.region__foot}>
        관내 평균 {formatNumber(totalHours, 1)}h · {formatNumber(ordered.length)}개 지역
      </p>
    </div>
  );
}
