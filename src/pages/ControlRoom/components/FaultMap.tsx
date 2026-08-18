import { useEffect, useRef, useState } from 'react';
import Chungcheongnamdo from '@/assets/geo/provinces/Chungcheongnamdo';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { MAP_FIT, MAP_VIEW, projectPoint } from '@/components/common/GeoMap/useMapProjection';
import { KakaoMiniMap } from '@/components/common/GeoMap/KakaoMiniMap';
import { useKakaoMaps } from '@/hooks/useKakaoMaps';
import { MapStatusFilter, useStatusFilter } from '@/components/plant/MapStatusFilter';
import { CloseIcon } from '@/components/common/Icon';
import { PlantDetailPanel } from '@/components/plant/PlantDetailPanel';
import type { School } from '@/interface/energy';
import styles from './FaultMap.module.scss';

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
  /** 이상 설비를 하나씩 돌아가며 펼친다 — 지켜보는 화면에서 아무도 누르지 않을 때를 위한 것 */
  tour?: boolean;
}

/** 순회가 한 곳에 머무는 시간(ms) */
const TOUR_MS = 7000;

/**
 * 발전소 위치 지도 (SFR-004-01/14).
 * 상황판은 훑어보는 화면이라 확대·이동 없이 위치와 상태만 보여 준다.
 */
export function FaultMap({ plants, scope = 'faults', height = MAP_HEIGHT, selectable, tour }: FaultMapProps) {
  const mapStatus = useKakaoMaps();
  const [openId, setOpenId] = useState<string | null>(null);
  // 사람이 한 번이라도 고르면 순회를 멈춘다 — 보고 있는 것을 화면이 빼앗으면 안 된다.
  const [isTouring, setIsTouring] = useState(Boolean(tour));
  const showAll = scope === 'all';
  const shown = showAll ? plants : plants.filter((plant) => isAbnormal(plant.status));
  // 범례가 곧 필터다 — 「경고 11개소」를 읽고 그 열한 곳만 남겨 볼 수 있어야 한다.
  const status = useStatusFilter(shown);
  const marks = status.visible;
  const label = showAll
    ? `충청남도 발전소 위치. 관내 ${marks.length}개소.`
    : `충청남도 장애 발생 위치. 이상 설비 ${marks.length}개소.`;
  const openPlant = marks.find((plant) => plant.id === openId) ?? null;

  /*
    이상 설비 순회.

    벽에 걸어 두는 화면이라 아무도 누르지 않는다. 지도에 점만 찍혀 있으면 어느 학교가
    무슨 일인지는 끝내 알 수 없으므로, 이상이 있는 곳을 하나씩 돌아가며 스스로 펼친다.
    사람이 하나를 고르면 멈추고, 닫으면 다시 돈다.
  */
  const abnormalIds = plants.filter((plant) => isAbnormal(plant.status)).map((plant) => plant.id);
  const idsKey = abnormalIds.join(',');
  const cursor = useRef(0);

  useEffect(() => {
    if (!isTouring || abnormalIds.length === 0) return undefined;

    const ids = idsKey.split(',');
    const step = () => {
      cursor.current = (cursor.current + 1) % ids.length;
      setOpenId(ids[cursor.current]);
    };

    setOpenId(ids[cursor.current % ids.length]);

    const timer = window.setInterval(step, TOUR_MS);

    return () => window.clearInterval(timer);
    // 목록이 바뀌면 처음부터 다시 돈다. 배열 자체는 매 렌더 새로 만들어지므로 이름만 이어 붙여 견준다.
  }, [isTouring, idsKey, abnormalIds.length]);

  /*
    고른 발전소 설명은 지도 옆에 편다 (SFR-004-01).
    상황판은 훑어보는 화면이라 말풍선으로 지도를 가리면 다른 곳을 못 본다.
  */
  const side = openPlant ? (
    <aside className={styles.side} aria-label={`${openPlant.name} 상세`}>
      <button
        type="button"
        className={styles.side__close}
        onClick={() => {
          setOpenId(null);
          // 닫으면 다시 순회로 돌아간다 — 지켜보는 화면은 손을 떼면 제자리로 와야 한다.
          if (tour) setIsTouring(true);
        }}
        aria-label="설명 닫기"
      >
        <CloseIcon width={15} height={15} />
      </button>
      <PlantDetailPanel plant={openPlant} />
    </aside>
  ) : null;

  /** 사람이 고른 것 — 순회를 멈추고 그 자리에 머문다 */
  const pick = (id: string) => {
    setIsTouring(false);
    setOpenId(id);
  };

  // 지도 키가 없거나 외부망이 막히면 내장 지도로 간다 — 상황판이 멈추면 안 된다.
  if (mapStatus === 'ready') {
    return (
      <div className={styles.map}>
        <KakaoMiniMap
          plants={marks}
          height={height}
          label={label}
          selectedId={openId ?? undefined}
          // 순회로 펼친 곳은 지도에서도 그 하나만 보이게 당긴다
          focusSelected={Boolean(tour)}
          onPick={selectable ? pick : undefined}
        />
        <MapStatusFilter
          counts={status.counts}
          picked={status.picked}
          onToggle={status.toggle}
          onReset={status.reset}
          hideEmpty
        />
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
                onClick={selectable ? () => pick(plant.id) : undefined}
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

      <MapStatusFilter
        counts={status.counts}
        picked={status.picked}
        onToggle={status.toggle}
        onReset={status.reset}
        hideEmpty
      />
      {side}
    </div>
  );
}
