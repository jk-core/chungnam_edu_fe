import { useCallback, useState } from 'react';
import Chungcheongnamdo from '@/assets/geo/provinces/Chungcheongnamdo';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { MAP_FIT, MAP_VIEW, projectPoint } from '@/components/common/GeoMap/useMapProjection';
import { NaverMiniMap } from '@/components/common/GeoMap/NaverMiniMap';
import { useNaverMaps } from '@/hooks/useNaverMaps';
import { formatNumber } from '@/utils/format';
import type { OperationStatus } from '@/interface/status';
import type { School } from '@/interface/energy';
import styles from './FaultMap.module.scss';

/** 범례에 세울 이상 상태 — 정상·준비중은 점을 찍지 않는다. */
const FAULT_STATES: OperationStatus[] = ['degraded', 'fault', 'commLost'];

interface FaultMapProps {
  /** 전체 발전소 — 이 중 이상 상태만 점으로 찍는다 */
  plants: School[];
}

/**
 * 장애 발생 위치 지도 (SFR-004-01/14).
 * 상황판 한 칸에 들어가는 크기라 확대·이동 없이 어디가 아픈지만 보여 준다.
 * 정상 설비는 찍지 않아 이상만 도드라진다.
 */
export function FaultMap({ plants }: FaultMapProps) {
  const naverStatus = useNaverMaps();
  const [broken, setBroken] = useState(false);
  const markBroken = useCallback(() => setBroken(true), []);
  const faults = plants.filter((plant) => isAbnormal(plant.status));
  const counts = FAULT_STATES.map((status) => ({
    status,
    count: plants.filter((plant) => plant.status === status).length,
  }));
  const label = `충청남도 장애 발생 위치. 이상 설비 ${faults.length}개소.`;

  // 지도 키가 없거나 외부망이 막히면 내장 지도로 간다 — 상황판이 멈추면 안 된다.
  if (naverStatus === 'ready' && !broken) {
    return (
      <div className={styles.map}>
        <NaverMiniMap plants={faults} height={210} label={label} onUnavailable={markBroken} />
        <FaultLegend counts={counts} />
      </div>
    );
  }

  return (
    <div className={styles.map}>
      <svg
        className={styles.map__svg}
        viewBox={`0 0 ${MAP_VIEW.width} ${MAP_VIEW.height}`}
        role="img"
        aria-label={label}
      >
        <g transform={`translate(${MAP_FIT.x} ${MAP_FIT.y}) scale(${MAP_FIT.scale})`}>
          <g className={styles.map__province}>
            <Chungcheongnamdo fill="var(--map-scale-1)" stroke="var(--map-border)" />
          </g>

          {faults.map((plant) => {
            const point = projectPoint(plant.location);
            // 확대하지 않으므로 점 크기는 지도 축척만 되돌려 맞춘다.
            const scale = 1 / MAP_FIT.scale;

            return (
              <g key={plant.id} transform={`translate(${point.x} ${point.y}) scale(${scale})`}>
                <circle className={`${styles.dot__halo} ${styles[`dot--${OPERATION_TONE[plant.status]}`]}`} r={11} />
                <circle className={`${styles.dot} ${styles[`dot--${OPERATION_TONE[plant.status]}`]}`} r={4.5}>
                  <title>{`${plant.name} · ${OPERATION_LABEL[plant.status]}`}</title>
                </circle>
              </g>
            );
          })}
        </g>
      </svg>

      <FaultLegend counts={counts} />
    </div>
  );
}

/** 색만으로 구분되지 않게 상태 이름과 개수를 함께 적는다 (COR-003) */
function FaultLegend({ counts }: { counts: { status: OperationStatus; count: number }[] }) {
  return (
    <ul className={styles.legend}>
      {counts.map(({ status, count }) => (
        <li key={status} className={styles.legend__item}>
          <span
            className={`${styles.legend__dot} ${styles[`legend__dot--${OPERATION_TONE[status]}`]}`}
            aria-hidden="true"
          />
          {OPERATION_LABEL[status]}
          <span className={styles.legend__count}>{formatNumber(count)}</span>
        </li>
      ))}
    </ul>
  );
}
