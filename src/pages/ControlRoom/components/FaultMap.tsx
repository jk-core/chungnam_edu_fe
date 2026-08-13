import { useState } from 'react';
import Chungcheongnamdo from '@/assets/geo/provinces/Chungcheongnamdo';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { MAP_FIT, MAP_VIEW, projectPoint } from '@/components/common/GeoMap/useMapProjection';
import { KakaoMiniMap } from '@/components/common/GeoMap/KakaoMiniMap';
import { useKakaoMaps } from '@/hooks/useKakaoMaps';
import { CloseIcon } from '@/components/common/Icon';
import { PlantDetailPanel } from '@/components/plant/PlantDetailPanel';
import { formatNumber } from '@/utils/format';
import type { OperationStatus } from '@/interface/status';
import type { School } from '@/interface/energy';
import styles from './FaultMap.module.scss';

/** 이상만 볼 때 범례에 세울 상태 — 정상·준비중은 점을 찍지 않는다. */
const FAULT_STATES: OperationStatus[] = ['degraded', 'fault', 'commLost'];

/** 관내 전부를 볼 때는 정상·준비중까지 다섯 결을 모두 센다. */
const ALL_STATES: OperationStatus[] = ['running', 'ready', 'degraded', 'fault', 'commLost'];

/** 상황판 한 칸에 들어가는 기본 높이 */
const MAP_HEIGHT = 210;

interface FaultMapProps {
  /** 전체 발전소 */
  plants: School[];
  /**
   * 무엇을 점으로 찍을지.
   * `faults` 는 이상만 찍어 어디가 아픈지 도드라지게 하고,
   * `all` 은 관내 전부를 상태 색으로 찍어 분포를 보여 준다.
   */
  scope?: 'faults' | 'all';
  /** 지도 높이. `'100%'` 를 주면 칸을 꽉 채운다 */
  height?: number | string;
  /** 점을 눌러 그 발전소 설명을 옆에 펼칠지 */
  selectable?: boolean;
}

/**
 * 발전소 위치 지도 (SFR-004-01/14).
 * 상황판은 훑어보는 화면이라 확대·이동 없이 위치와 상태만 보여 준다.
 */
export function FaultMap({ plants, scope = 'faults', height = MAP_HEIGHT, selectable }: FaultMapProps) {
  const mapStatus = useKakaoMaps();
  const [openId, setOpenId] = useState<string | null>(null);
  const showAll = scope === 'all';
  const marks = showAll ? plants : plants.filter((plant) => isAbnormal(plant.status));
  const counts = (showAll ? ALL_STATES : FAULT_STATES).map((status) => ({
    status,
    count: plants.filter((plant) => plant.status === status).length,
  }));
  const label = showAll
    ? `충청남도 발전소 위치. 관내 ${marks.length}개소.`
    : `충청남도 장애 발생 위치. 이상 설비 ${marks.length}개소.`;
  const openPlant = marks.find((plant) => plant.id === openId) ?? null;

  /*
    고른 발전소 설명은 지도 옆에 편다 (SFR-004-01).
    상황판은 훑어보는 화면이라 말풍선으로 지도를 가리면 다른 곳을 못 본다.
  */
  const side = openPlant ? (
    <aside className={styles.side} aria-label={`${openPlant.name} 상세`}>
      <button
        type="button"
        className={styles.side__close}
        onClick={() => setOpenId(null)}
        aria-label="설명 닫기"
      >
        <CloseIcon width={15} height={15} />
      </button>
      <PlantDetailPanel plant={openPlant} />
    </aside>
  ) : null;

  // 지도 키가 없거나 외부망이 막히면 내장 지도로 간다 — 상황판이 멈추면 안 된다.
  if (mapStatus === 'ready') {
    return (
      <div className={styles.map}>
        <KakaoMiniMap
          plants={marks}
          height={height}
          label={label}
          selectedId={openId ?? undefined}
          onPick={selectable ? setOpenId : undefined}
        />
        <FaultLegend counts={counts} />
        {side}
      </div>
    );
  }

  return (
    <div className={styles.map}>
      <svg
        className={styles.map__svg}
        style={{ height }}
        viewBox={`0 0 ${MAP_VIEW.width} ${MAP_VIEW.height}`}
        role="img"
        aria-label={label}
      >
        <g transform={`translate(${MAP_FIT.x} ${MAP_FIT.y}) scale(${MAP_FIT.scale})`}>
          <g className={styles.map__province}>
            {/* 시·군 경계선은 긋지 않는다 — 상황판에서 읽을 것은 도 모양과 그 위 점이다. */}
            <Chungcheongnamdo fill="var(--map-scale-1)" stroke="none" />
          </g>

          {marks.map((plant) => {
            const point = projectPoint(plant.location);
            // 확대하지 않으므로 점 크기는 지도 축척만 되돌려 맞춘다.
            const scale = 1 / MAP_FIT.scale;

            return (
              <g
                key={plant.id}
                transform={`translate(${point.x} ${point.y}) scale(${scale})`}
                className={selectable ? styles.pick : undefined}
                role={selectable ? 'button' : undefined}
                aria-label={selectable ? `${plant.name} 설명 보기` : undefined}
                onClick={selectable ? () => setOpenId(plant.id) : undefined}
              >
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
      {side}
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
