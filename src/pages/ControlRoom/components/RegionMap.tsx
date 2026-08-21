import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { REGION_BOUNDS, REGION_BOX, REGION_SHAPE_BOX, REGION_SHAPES, REGION_VIEW } from '@/assets/geo/chungnamRegions';
import { PLANT_MAP_POINTS } from '@/assets/geo/plantMapPoints';
import type { School } from '@/interface/energy';
import styles from './AiDiagnosisPanel.module.scss';

/**
 * 한 지역을 볼 때 당기는 정도.
 *
 * 그 시·군의 면이 판 안에 다 들어오도록 맞추되, 꽉 채우지는 않는다 — 가장자리에 여백을 두어야
 * 이웃 지역의 윤곽이 함께 보이고 도 어디쯤인지를 잃지 않는다. 계룡시처럼 좁은 곳은 배율이
 * 끝없이 올라가므로 상한을 둔다.
 */
const ZOOM_FILL = 0.78;
const ZOOM_MAX = 6;

/** 점과 선의 굵기는 판(600 x 516) 기준이다 — 당긴 배율로 나눠 화면에서는 늘 같은 크기로 보인다 */
const DOT_R = 11;
const DOT_STROKE = 2.6;

/** 판 가장자리에서 점이 잘리지 않게 두는 여백 */
const EDGE_PAD = 6;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * 위경도를 지도 판 좌표로 옮긴다.
 * 시·군 면이 차지하는 상자에 충남의 위경도 범위를 맞춰 선형으로 대응시킨다.
 * 도형에 섬이 없는 도서 분교는 판 밖으로 나가므로 가장자리에 붙여 둔다 — 지워 버리면
 * 「N개소」 를 세는 요약 글과 지도 위 점 수가 어긋난다.
 */
function project(point: { lng: number; lat: number }) {
  const lngRatio = (point.lng - REGION_BOUNDS.minLng) / (REGION_BOUNDS.maxLng - REGION_BOUNDS.minLng);
  const latRatio = (REGION_BOUNDS.maxLat - point.lat) / (REGION_BOUNDS.maxLat - REGION_BOUNDS.minLat);

  return {
    x: clamp(REGION_BOX.x + lngRatio * REGION_BOX.width, EDGE_PAD, REGION_VIEW.width - EDGE_PAD),
    y: clamp(REGION_BOX.y + latRatio * REGION_BOX.height, EDGE_PAD, REGION_VIEW.height - EDGE_PAD),
  };
}

/**
 * 발전소 한 곳이 판에서 앉는 자리.
 * 미리 재 둔 값이 있으면 그것을 쓴다 — 경계에 붙은 학교를 자기 시·군 면 안으로 밀어 넣은 값이다.
 */
function pointOf(plant: School) {
  const fixed = PLANT_MAP_POINTS[plant.id];

  return fixed ? { x: fixed[0], y: fixed[1] } : project(plant.location);
}

interface RegionMapProps {
  /** 지금 보고 있는 지역 이름 */
  name: string;
  /** 그 지역의 발전소 — 상태 색으로 점을 찍는다 */
  plants: School[];
}

/**
 * 지역 위치 지도 (SFR-004-01).
 *
 * 요약 글만으로는 「어느 지역」 이 도 안에서 어디쯤인지 알 수 없다. 시·군으로 나뉜 도를 두고
 * 지금 읽는 지역만 물들인 뒤 그쪽으로 당기면, 글을 읽기 전에 자리부터 잡힌다. 그 지역
 * 발전소는 상태 색 점으로 찍어 요약 글의 「N개소 정상·이상」 이 지도 위에서 그대로 세어진다.
 */
export function RegionMap({ name, plants }: RegionMapProps) {
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
      {/*
        뷰박스는 CSS 로 부드럽게 바뀌지 않으므로 안쪽 묶음을 옮기고 키운다 —
        지역이 넘어갈 때 지도가 미끄러지듯 따라간다.
      */}
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
              className={`${styles.map__dot} ${styles[`map__dot--${OPERATION_TONE[plant.status]}`]}`}
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
