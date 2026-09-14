import {
  REGION_BOUNDS, REGION_BOX, REGION_SHAPE_BOX, REGION_SHAPES, REGION_VIEW,
} from '@/assets/geo/chungnamRegions';
import { PLANT_MAP_POINTS } from '@/assets/geo/plantMapPoints';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import type { School } from '@/interface/energy';
import { TONE_VAR } from './status';
import styles from './AiPanel.module.scss';
import type { CSSProperties } from 'react';

/**
 * 한 지역을 볼 때 당기는 정도. 그 시·군 면이 판에 다 들어오되 꽉 채우지 않아 이웃 윤곽도
 * 함께 보이게 한다. 계룡시처럼 좁은 곳은 배율이 끝없이 올라가므로 상한을 둔다.
 */
const ZOOM_FILL = 0.78;
const ZOOM_MAX = 6;

/** 점 크기는 판(600×516) 기준 — 당긴 배율로 나눠 화면에서는 늘 같게 보인다 */
const DOT_R = 10;
const DOT_STROKE = 2.4;

/** 판 가장자리에서 점이 잘리지 않게 두는 여백 */
const EDGE_PAD = 6;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** 위경도를 지도 판 좌표로 옮긴다 */
function project(point: { lng: number; lat: number }) {
  const lngRatio = (point.lng - REGION_BOUNDS.minLng) / (REGION_BOUNDS.maxLng - REGION_BOUNDS.minLng);
  const latRatio = (REGION_BOUNDS.maxLat - point.lat) / (REGION_BOUNDS.maxLat - REGION_BOUNDS.minLat);

  return {
    x: clamp(REGION_BOX.x + lngRatio * REGION_BOX.width, EDGE_PAD, REGION_VIEW.width - EDGE_PAD),
    y: clamp(REGION_BOX.y + latRatio * REGION_BOX.height, EDGE_PAD, REGION_VIEW.height - EDGE_PAD),
  };
}

/** 발전소 한 곳이 판에서 앉는 자리 — 미리 재 둔 값이 있으면 그것을 쓴다 */
function pointOf(plant: School) {
  const fixed = PLANT_MAP_POINTS[plant.id];

  return fixed ? { x: fixed[0], y: fixed[1] } : project(plant.location);
}

/**
 * 지역 위치 지도 (SFR-004-01) — 청사진 판.
 *
 * 요약 글만으로는 그 지역이 도 안에서 어디인지 알 수 없다. 시·군 도형을 선으로만 두고 지금
 * 읽는 곳만 물들인 뒤 그쪽으로 당기면, 글을 읽기 전에 자리부터 잡힌다. 발전소는 상태 색 점으로
 * 찍어 요약 글의 「N개소 정상·이상」 이 지도에서 그대로 세어진다.
 */
export function RegionLocator({ name, plants }: { name: string; plants: School[] }) {
  const box = REGION_SHAPE_BOX[name] ?? null;
  const zoom = box
    ? clamp(Math.min(REGION_VIEW.width / box.width, REGION_VIEW.height / box.height) * ZOOM_FILL, 1, ZOOM_MAX)
    : 1;
  const centerX = box ? box.x + box.width / 2 : REGION_VIEW.width / 2;
  const centerY = box ? box.y + box.height / 2 : REGION_VIEW.height / 2;
  const shiftX = REGION_VIEW.width / 2 - centerX * zoom;
  const shiftY = REGION_VIEW.height / 2 - centerY * zoom;

  return (
    <svg
      className={styles.map}
      viewBox={`0 0 ${REGION_VIEW.width} ${REGION_VIEW.height}`}
      role="img"
      aria-label={`${name} 위치와 발전소 ${plants.length}개소 상태`}
    >
      <g className={styles.map__zoom} style={{ transform: `translate(${shiftX}px, ${shiftY}px) scale(${zoom})` }}>
        {REGION_SHAPES.map((shape) => (
          <path
            key={shape.id}
            className={styles.map__cell}
            data-on={shape.region === name ? '' : undefined}
            d={shape.d}
            transform={shape.transform}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {plants.map((plant) => {
          const point = pointOf(plant);

          return (
            <circle
              key={plant.id}
              className={styles.map__dot}
              style={{ '--seg': TONE_VAR[OPERATION_TONE[plant.status]] } as CSSProperties}
              cx={point.x}
              cy={point.y}
              r={DOT_R / zoom}
              strokeWidth={DOT_STROKE / zoom}
            >
              <title>{`${plant.name} · ${OPERATION_LABEL[plant.status]}`}</title>
            </circle>
          );
        })}
      </g>
    </svg>
  );
}
