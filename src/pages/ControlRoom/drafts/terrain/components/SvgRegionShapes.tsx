import { REGION_SHAPE_BOX, REGION_SHAPES, REGION_VIEW } from '@/assets/geo/chungnamRegions';
import { formatNumber } from '@/utils/format';
import styles from './SvgRegionShapes.module.scss';
import type { RegionStat } from '../hooks/useTerrainRegions';
import type { CSSProperties } from 'react';

/** 이름표가 시·군 면 밖으로 밀려나지 않게 두는 여백 */
const EDGE_PAD = 40;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** 시·군 면의 한가운데 — 이름표가 앉는 자리다 */
function centerOf(region: string) {
  const box = REGION_SHAPE_BOX[region];

  if (!box) return { x: REGION_VIEW.width / 2, y: REGION_VIEW.height / 2 };

  return {
    x: clamp(box.x + box.width / 2, EDGE_PAD, REGION_VIEW.width - EDGE_PAD),
    y: clamp(box.y + box.height / 2, 16, REGION_VIEW.height - 16),
  };
}

interface SvgRegionShapesProps {
  regions: RegionStat[];
  activeName: string;
  colorForRegion: (name: string) => string;
  indexOfRegion: (name: string) => number;
  onSelect: (index: number) => void;
}

/**
 * 도형 지도 — 카카오 지도를 못 쓸 때의 대체.
 *
 * 카카오맵 키가 없거나 학교망에서 외부 타일을 못 내려받는 자리에서는 실지도가 뜨지 않으므로,
 * 도 경계 도형에 시·군 개소 수를 단계색으로 물들여 대신 세운다. 이름과 개소 수는 벽에서
 * 읽히게 크게 얹는다. 이 도형은 실제 해안선을 단순화한 것이라 실지도 위에 얹지는 않는다.
 */
export function SvgRegionShapes({ regions, activeName, colorForRegion, indexOfRegion, onSelect }: SvgRegionShapesProps) {
  return (
    <svg
      className={styles.canvas}
      viewBox={`0 0 ${REGION_VIEW.width} ${REGION_VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-label={`충청남도 시·군별 개소 현황 지도. 지금 ${activeName}`}
    >
      {REGION_SHAPES.map((shape) => {
        const at = indexOfRegion(shape.region);

        return (
          <path
            key={shape.id}
            className={styles.cell}
            style={{ '--cell': colorForRegion(shape.region) } as CSSProperties}
            data-on={shape.region === activeName ? '' : undefined}
            data-pick={at >= 0 ? '' : undefined}
            role={at >= 0 ? 'button' : undefined}
            tabIndex={at >= 0 ? 0 : undefined}
            aria-label={at >= 0 ? `${shape.region} 보기` : undefined}
            aria-current={shape.region === activeName ? 'true' : undefined}
            onClick={at >= 0 ? () => onSelect(at) : undefined}
            onKeyDown={at >= 0 ? (event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;

              event.preventDefault();
              onSelect(at);
            } : undefined}
            d={shape.d}
            transform={shape.transform}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}

      {/* 이름표는 면을 다 그린 뒤에 얹는다 — 섞어 그리면 뒤 면이 앞 이름표를 덮는다 */}
      {regions.map((region) => {
        const at = centerOf(region.name);

        return (
          <g
            key={region.name}
            className={styles.tag}
            data-on={region.name === activeName ? '' : undefined}
            transform={`translate(${at.x} ${at.y})`}
          >
            <text className={styles.tag__name} y={0} textAnchor="middle">{region.name}</text>
            <text className={styles.tag__count} y={26} textAnchor="middle">
              {formatNumber(region.count)}개소
            </text>
          </g>
        );
      })}
    </svg>
  );
}
