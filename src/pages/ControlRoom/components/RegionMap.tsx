import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { REGION_BOX, REGION_SHAPES, REGION_VIEW } from '@/assets/geo/chungnamRegions';
import type { School } from '@/interface/energy';
import { CHUNGNAM_BOUNDS } from '@/components/common/GeoMap/useMapProjection';
import styles from './AiDiagnosisPanel.module.scss';

/**
 * 한 지역을 볼 때 당기는 정도.
 *
 * 칸을 화면에 꽉 채우면 그 지역만 남아 도 어디쯤인지를 잃는다. 여백을 넉넉히 두고 최대
 * 배율도 묶어, 당겨도 이웃 지역의 윤곽이 함께 보이게 한다.
 */
const ZOOM_FILL = 0.8;
const ZOOM_MAX = 3;

/** 점과 선의 굵기는 판(600 x 516) 기준이다 */
const DOT_R = 6;
const DOT_STROKE = 2;

/**
 * 위경도를 지도 판 좌표로 옮긴다.
 * 시·군 면이 차지하는 상자에 충남의 위경도 범위를 맞춰 선형으로 대응시킨다.
 */
function project(point: { lng: number; lat: number }) {
  const lngRatio = (point.lng - CHUNGNAM_BOUNDS.minLng) / (CHUNGNAM_BOUNDS.maxLng - CHUNGNAM_BOUNDS.minLng);
  const latRatio = (CHUNGNAM_BOUNDS.maxLat - point.lat) / (CHUNGNAM_BOUNDS.maxLat - CHUNGNAM_BOUNDS.minLat);

  return {
    x: REGION_BOX.x + lngRatio * REGION_BOX.width,
    y: REGION_BOX.y + latRatio * REGION_BOX.height,
  };
}

/**
 * 그 지역 발전소가 퍼져 있는 상자.
 * 시·군 면의 경로를 재려면 그리기 전에는 알 수 없으므로, 그 안의 발전소 자리로 대신 잡는다.
 */
function spreadOf(plants: School[]) {
  const points = plants.map((plant) => project(plant.location));
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  if (points.length === 0) return null;

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);

  return {
    x: minX,
    y: minY,
    // 한 곳뿐이면 넓이가 0 이라 당길 배율을 낼 수 없다 — 최소 크기를 준다.
    width: Math.max(Math.max(...xs) - minX, 60),
    height: Math.max(Math.max(...ys) - minY, 60),
  };
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
  const spread = spreadOf(plants);
  const zoom = spread
    ? Math.min(ZOOM_MAX, Math.max(1, Math.min(REGION_VIEW.width / spread.width, REGION_VIEW.height / spread.height) * ZOOM_FILL))
    : 1;
  const centerX = spread ? spread.x + spread.width / 2 : REGION_VIEW.width / 2;
  const centerY = spread ? spread.y + spread.height / 2 : REGION_VIEW.height / 2;
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
            data-kind={shape.kind}
            data-on={shape.region === name ? '' : undefined}
            d={shape.d}
            transform={shape.transform}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {plants.map((plant) => {
          const point = project(plant.location);

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
