import Chungcheongnamdo from '@/assets/geo/provinces/Chungcheongnamdo';
import { CHUNGNAM_PATH_BBOX, projectPoint } from '@/components/common/GeoMap/useMapProjection';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import type { School } from '@/interface/energy';
import { boundsOf, pathOf, REGION_CELLS } from '../utils/regionCells';
import styles from './AiDiagnosisPanel.module.scss';

/*
  도 경로가 차지하는 상자에 여백만 두르고 그대로 그린다.

  화면 좌표계로 옮겨 그리면 낮고 넓은 칸에서 위아래로만 맞춰지며 좌우가 텅 빈다.
  경로 상자를 그대로 뷰박스로 쓰면 그 빈자리가 사라진다.
*/
const PAD = 4;
const VIEW = {
  x: CHUNGNAM_PATH_BBOX.x - PAD,
  y: CHUNGNAM_PATH_BBOX.y - PAD,
  width: CHUNGNAM_PATH_BBOX.width + PAD * 2,
  height: CHUNGNAM_PATH_BBOX.height + PAD * 2,
};

/**
 * 한 지역을 볼 때 당기는 정도.
 *
 * 칸을 화면에 꽉 채우면 그 지역만 남아 도 어디쯤인지를 잃는다. 여백을 넉넉히 두고 최대
 * 배율도 묶어, 당겨도 이웃 지역의 윤곽이 함께 보이게 한다.
 */
const ZOOM_FILL = 0.86;
const ZOOM_MAX = 3.4;

/** 점과 선의 굵기는 경로 상자(105 x 90) 기준이다 — 화면 크기로 나누면 실오라기가 된다 */
const DOT_R = 1.5;
const DOT_STROKE = 0.5;

interface RegionMapProps {
  /** 지금 보고 있는 지역 이름 */
  name: string;
  /** 그 지역의 발전소 — 상태 색으로 점을 찍는다 */
  plants: School[];
}

/**
 * 지역 위치 지도 (SFR-004-01).
 *
 * 요약 글만으로는 「어느 지역」 이 도 안에서 어디쯤인지 알 수 없다. 도를 시·군으로 나눠 두고
 * 지금 읽는 지역만 물들인 뒤 그쪽으로 당기면, 글을 읽기 전에 자리부터 잡힌다. 그 지역
 * 발전소는 상태 색 점으로 찍어 요약 글의 「N개소 정상·이상」 이 지도 위에서 그대로 세어진다.
 *
 * 나뉜 경계는 중심점 사이의 등거리선으로 근사한 것이다(utils/regionCells).
 */
export function RegionMap({ name, plants }: RegionMapProps) {
  const cell = REGION_CELLS.find((item) => item.name === name);
  const box = cell ? boundsOf(cell.polygon) : null;

  /*
    지역 칸이 화면 가운데 오도록 당긴다.

    뷰박스는 CSS 로 부드럽게 바뀌지 않으므로 안쪽 묶음을 옮기고 키운다 — 지역이 넘어갈 때
    지도가 미끄러지듯 따라간다.
  */
  const zoom = box
    ? Math.min(ZOOM_MAX, Math.max(1, Math.min(VIEW.width / box.width, VIEW.height / box.height) * ZOOM_FILL))
    : 1;
  const centerX = box ? box.x + box.width / 2 : VIEW.x + VIEW.width / 2;
  const centerY = box ? box.y + box.height / 2 : VIEW.y + VIEW.height / 2;
  const shiftX = VIEW.x + VIEW.width / 2 - centerX * zoom;
  const shiftY = VIEW.y + VIEW.height / 2 - centerY * zoom;

  return (
    <svg
      className={styles.map}
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`}
      role="img"
      aria-label={`${name} 위치와 발전소 ${plants.length}개소 상태`}
    >
      <defs>
        {/* 나눈 칸이 도 밖으로 삐져나가지 않게 도 모양으로 오려 낸다 */}
        <clipPath id="region-map-clip">
          <Chungcheongnamdo fill="#fff" stroke="none" />
        </clipPath>
      </defs>

      <g className={styles.map__zoom} style={{ transform: `translate(${shiftX}px, ${shiftY}px) scale(${zoom})` }}>
        <g className={styles.map__ground}>
          <Chungcheongnamdo fill="currentColor" stroke="none" />
        </g>

        <g clipPath="url(#region-map-clip)">
          {REGION_CELLS.map((item) => (
            <path
              key={item.code}
              className={styles.map__cell}
              data-on={item.name === name ? '' : undefined}
              d={pathOf(item.polygon)}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        {plants.map((plant) => {
          const point = projectPoint(plant.location);

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
