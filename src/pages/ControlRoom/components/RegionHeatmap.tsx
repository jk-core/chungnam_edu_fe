import { useMemo } from 'react';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { currentOutputOf } from '@/mocks/schoolOutput';
import { REGIONS } from '@/mocks/regions';
import { formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from './RegionHeatmap.module.scss';

/** 칸 밝기가 바닥을 치지 않게 잡아 두는 하한 — 아주 옅은 칸은 꺼진 것처럼 보인다 */
const MIN_TINT = 0.4;

interface RegionHeatmapProps {
  plants: School[];
}

/**
 * 권역별 상태 히트맵 (SFR-004-13/14).
 *
 * 지도는 "어디" 를 답하지만 점이 겹치고 묶여 "몇 개" 를 잘 답하지 못한다. 여기서는 발전소 하나가
 * 칸 하나가 되어 관내 전부가 한 판에 깔린다 — 붉은 칸이 셋인지 열인지가 세지 않아도 보인다.
 *
 * 칸에 이름을 달지 않는 것이 중요하다. 백 개가 넘는 칸 전부에 이름을 달면 이름이 아니라 벽지가 된다.
 * 이름은 옆 판의 장애 목록이 맡고, 여기서는 색과 개수만 말한다.
 */
export function RegionHeatmap({ plants }: RegionHeatmapProps) {
  // 권역을 행으로 세운다. 관내 분포가 시·군 단위로 읽히는 것이 이 판의 좌표계다.
  const bands = useMemo(() => REGIONS
    .map((region) => ({
      code: region.code,
      name: region.name,
      members: plants.filter((plant) => plant.regionCode === region.code),
    }))
    .filter((band) => band.members.length > 0), [plants]);

  return (
    <div className={styles.heatmap}>
      {bands.map((band) => {
        const bad = band.members.filter((plant) => isAbnormal(plant.status)).length;

        return (
          <section key={band.code} className={styles.band} aria-label={`${band.name} ${band.members.length}개소, 이상 ${bad}개소`}>
            <h3 className={styles.band__name}>
              {band.name}
              <span data-bad={bad > 0 ? '' : undefined}>{bad > 0 ? `${bad}` : band.members.length}</span>
            </h3>

            <ul className={styles.cells}>
              {band.members.map((plant) => {
                // 이용률은 좁은 구간에 몰려 있어 그대로 쓰면 차이가 안 보인다 — 그 구간을 펴서 쓴다.
                const tint = MIN_TINT + (1 - MIN_TINT) * Math.min(1, Math.max(0, (plant.utilization - 0.1) / 0.08));

                return (
                  <li
                    key={plant.id}
                    className={isAbnormal(plant.status) ? `${styles.cell} ${styles['cell--bad']}` : styles.cell}
                    data-tone={OPERATION_TONE[plant.status]}
                    style={{ '--tint': isAbnormal(plant.status) ? 1 : tint.toFixed(2) } as React.CSSProperties}
                    title={`${plant.name} · ${OPERATION_LABEL[plant.status]} · ${formatNumber(currentOutputOf(plant), 1)}kW`}
                  >
                    <span className={styles.cell__sr}>
                      {plant.name} {OPERATION_LABEL[plant.status]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
