import Chungcheongnamdo from '@/assets/geo/provinces/Chungcheongnamdo';
import { CHUNGNAM_PATH_BBOX, projectPoint } from '@/components/common/GeoMap/useMapProjection';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import type { School } from '@/interface/energy';
import { pathOf, REGION_CELLS } from '../utils/regionCells';
import styles from './AiDiagnosisPanel.module.scss';

/*
  도 경로가 차지하는 상자에 여백만 두르고 그대로 그린다.

  화면 좌표계(MAP_VIEW)로 옮겨 그리면 480x420 판 안에 도가 들어앉아, 낮고 넓은 칸에서는
  위아래로만 맞춰지며 좌우가 텅 빈다. 경로 상자를 그대로 뷰박스로 쓰면 그 빈자리가 사라진다.
*/
const PAD = 4;
const VIEW_BOX = [
  CHUNGNAM_PATH_BBOX.x - PAD,
  CHUNGNAM_PATH_BBOX.y - PAD,
  CHUNGNAM_PATH_BBOX.width + PAD * 2,
  CHUNGNAM_PATH_BBOX.height + PAD * 2,
].join(' ');

/** 점과 선의 굵기는 경로 상자(105 x 90) 기준이다 — 화면 크기로 나누면 실오라기가 된다 */
const DOT_R = 1.5;
const DOT_STROKE = 0.5;
const CELL_STROKE = 0.4;

interface RegionMapProps {
  /** 지금 보고 있는 지역 이름 */
  name: string;
  /** 그 지역의 발전소 — 상태 색으로 점을 찍는다 */
  plants: School[];
}

/**
 * 지역 위치 지도 (SFR-004-01).
 *
 * 요약 글만으로는 「어느 지역」 이 도 안에서 어디쯤인지 알 수 없다. 도를 지역별로 나눠 두고
 * 지금 읽는 지역만 물들이면, 글을 읽기 전에 자리부터 잡힌다. 그 지역 발전소는 상태 색 점으로
 * 찍어 요약 글의 「N개소 정상·이상」 이 지도 위에서 그대로 세어진다.
 *
 * 나뉜 경계는 중심점 사이의 등거리선으로 근사한 것이다(utils/regionCells).
 */
export function RegionMap({ name, plants }: RegionMapProps) {
  return (
    <svg
      className={styles.map}
      viewBox={VIEW_BOX}
      role="img"
      aria-label={`${name} 위치와 발전소 ${plants.length}개소 상태`}
    >
      <defs>
        {/* 나눈 칸이 도 밖으로 삐져나가지 않게 도 모양으로 오려 낸다 */}
        <clipPath id="region-map-clip">
          <Chungcheongnamdo fill="#fff" stroke="none" />
        </clipPath>
      </defs>

      <g className={styles.map__ground}>
        <Chungcheongnamdo fill="currentColor" stroke="none" />
      </g>

      <g clipPath="url(#region-map-clip)">
        {REGION_CELLS.map((cell) => (
          <path
            key={cell.code}
            className={styles.map__cell}
            data-on={cell.name === name ? '' : undefined}
            d={pathOf(cell.polygon)}
            strokeWidth={CELL_STROKE}
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
            r={DOT_R}
            strokeWidth={DOT_STROKE}
          >
            <title>{`${plant.name} · ${OPERATION_LABEL[plant.status]}`}</title>
          </circle>
        );
      })}
    </svg>
  );
}
