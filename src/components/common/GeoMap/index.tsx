import { useMemo, useRef, useState } from 'react';
import Chungcheongnamdo from '@/assets/geo/provinces/Chungcheongnamdo';
import { CloseIcon, ExpandIcon, MinusIcon, PlusIcon } from '@/components/common/Icon';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { REGIONS } from '@/mocks/regions';
import { cn } from '@/utils/cn';
import type { OperationStatus } from '@/interface/status';
import type { School } from '@/interface/energy';
import { clusterMarkers } from './clusterMarkers';
import styles from './GeoMap.module.scss';
import { MAP_FIT, MAP_VIEW, projectPoint } from './useMapProjection';
import type { MapMarkerDatum } from './clusterMarkers';
import type { ReactNode } from 'react';

const ZOOM = { min: 1, max: 6, step: 1.6 };
// 초기 배율에서는 시·군 하나가 한 묶음이 되도록 넉넉히 잡는다. 확대하면 칸이 좁아져 흩어진다.
const CLUSTER_CELL = 58;

interface GeoMapProps {
  plants: School[];
  /** 마커를 눌렀을 때 띄울 팝업 본문 */
  renderPopup: (plant: School) => ReactNode;
  selectedId?: string | null;
  onSelect?: (plant: School) => void;
  height?: number;
  /** 지도를 대신 읽을 표. 스크린리더와 인쇄 양쪽에 쓴다. */
  fallback: ReactNode;
}

const TONE_CLASS: Record<OperationStatus, string> = {
  running: 'ok',
  ready: 'brand',
  degraded: 'caution',
  fault: 'critical',
  commLost: 'offline',
};

/**
 * 충청남도 설비 지도 (SFR-007-05~10).
 * 실제 행정경계 위에 발전소를 위경도로 투영해 찍는다.
 * 경계 경로와 마커에 같은 변환을 걸어 두 층이 어긋나지 않게 한다.
 */
export function GeoMap({ plants, renderPopup, selectedId, onSelect, height = 460, fallback }: GeoMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [openId, setOpenId] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const markers = useMemo<MapMarkerDatum<School>[]>(
    () => plants.map((plant) => {
      const { x, y } = projectPoint(plant.location);

      return { id: plant.id, x, y, tone: OPERATION_TONE[plant.status], label: plant.name, data: plant };
    }),
    [plants],
  );

  // 묶음 격자는 화면에 보이는 크기 기준이라, 원본 좌표에서는 맞춤 배율만큼 나눠 잡는다.
  const clusters = useMemo(
    () => clusterMarkers(markers, zoom, CLUSTER_CELL / MAP_FIT.scale),
    [markers, zoom],
  );
  const regionPoints = useMemo(
    () => REGIONS.map((region) => ({ code: region.code, name: region.name, ...projectPoint(region.center) })),
    [],
  );

  const openMarker = markers.find((marker) => marker.id === openId) ?? null;

  const applyZoom = (nextZoom: number) => {
    const clamped = Math.min(ZOOM.max, Math.max(ZOOM.min, nextZoom));
    const limit = (clamped - 1) * 0.5;

    setZoom(clamped);
    setPan((prev) => ({
      x: Math.max(-limit, Math.min(limit, prev.x)),
      y: Math.max(-limit, Math.min(limit, prev.y)),
    }));
  };

  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setOpenId(null);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (zoom === 1) return;

    dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;

    if (!drag) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const limit = (zoom - 1) * 0.5;

    setPan({
      x: Math.max(-limit, Math.min(limit, drag.panX + (event.clientX - drag.x) / rect.width)),
      y: Math.max(-limit, Math.min(limit, drag.panY + (event.clientY - drag.y) / rect.height)),
    });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  // 마커는 확대해도 화면상 크기를 지킨다 — 맞춤 배율과 확대 배율을 함께 되돌린다 (SFR-007-09).
  const markerScale = 1 / (MAP_FIT.scale * zoom);

  /** 원본 좌표를 화면 비율로 옮긴다. 팝업을 마커 위에 얹을 때 쓴다. */
  const toRatio = (value: number, axis: 'x' | 'y') => {
    const offset = axis === 'x' ? MAP_FIT.x : MAP_FIT.y;
    const size = axis === 'x' ? MAP_VIEW.width : MAP_VIEW.height;

    return (value * MAP_FIT.scale + offset) / size;
  };

  const popupPosition = openMarker
    ? {
      left: `${((toRatio(openMarker.x, 'x') - 0.5) * zoom + 0.5 + pan.x) * 100}%`,
      top: `${((toRatio(openMarker.y, 'y') - 0.5) * zoom + 0.5 + pan.y) * 100}%`,
    }
    : undefined;

  return (
    <div>
      <div className={styles.map} style={{ height }}>
        <div
          className={styles.map__viewport}
          style={{ height }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <svg
            className={styles.map__svg}
            viewBox={`0 0 ${MAP_VIEW.width} ${MAP_VIEW.height}`}
            role="img"
            aria-label={`충청남도 발전소 ${plants.length}개소 위치 지도. 아래 "표로 보기"에서 같은 내용을 표로 확인할 수 있습니다.`}
          >
            <g
              className={styles.map__stage}
              transform={`translate(${pan.x * MAP_VIEW.width} ${pan.y * MAP_VIEW.height}) translate(${MAP_VIEW.width / 2} ${MAP_VIEW.height / 2}) scale(${zoom}) translate(${-MAP_VIEW.width / 2} ${-MAP_VIEW.height / 2})`}
            >
              {/* 경계와 마커를 같은 변환 안에 넣어 두 층이 어긋나지 않게 한다. */}
              <g transform={`translate(${MAP_FIT.x} ${MAP_FIT.y}) scale(${MAP_FIT.scale})`}>
                <g className={styles.province}>
                  <Chungcheongnamdo fill="var(--map-scale-2)" stroke="var(--surface)" />
                </g>

                {regionPoints.map((region) => (
                  <text
                    key={region.code}
                    className={styles.region__label}
                    x={region.x}
                    y={region.y - 8 * markerScale}
                    style={{ fontSize: `${11 * markerScale}px` }}
                  >
                    {region.name}
                  </text>
                ))}

                {clusters.map((cluster) => {
                  if (cluster.members.length === 1) {
                    const marker = cluster.members[0];
                    const plant = marker.data;

                    return (
                      <g
                        key={marker.id}
                        className={cn(styles.marker, { [styles['marker--selected']]: marker.id === selectedId })}
                        transform={`translate(${marker.x} ${marker.y}) scale(${markerScale})`}
                        role="button"
                        tabIndex={0}
                        aria-label={`${plant.name}, ${plant.regionName}, ${OPERATION_LABEL[plant.status]}`}
                        onClick={() => {
                          setOpenId(marker.id);
                          onSelect?.(plant);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return;

                          event.preventDefault();
                          setOpenId(marker.id);
                          onSelect?.(plant);
                        }}
                      >
                        {isAbnormal(plant.status) ? <circle className={styles.marker__ring} r={9} /> : null}
                        <circle
                          className={cn(styles.marker__dot, styles[`marker__dot--${TONE_CLASS[plant.status]}`])}
                          r={5}
                        />
                      </g>
                    );
                  }

                  const abnormalCount = cluster.members.filter((item) => isAbnormal(item.data.status)).length;
                  const radius = 11 + Math.min(7, Math.floor(cluster.members.length / 4));

                  return (
                    <g
                      key={cluster.id}
                      className={styles.cluster}
                      transform={`translate(${cluster.x} ${cluster.y}) scale(${markerScale})`}
                      role="button"
                      tabIndex={0}
                      aria-label={`발전소 ${cluster.members.length}개소 묶음${abnormalCount > 0 ? `, 이상 ${abnormalCount}개소` : ''}. 확대하면 흩어집니다.`}
                      onClick={() => applyZoom(zoom * ZOOM.step)}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return;

                        event.preventDefault();
                        applyZoom(zoom * ZOOM.step);
                      }}
                    >
                      <circle className={styles.cluster__bubble} r={radius} />
                      <text className={styles.cluster__count} y={3.5}>
                        {cluster.members.length}
                      </text>
                      {abnormalCount > 0 ? (
                        <circle className={styles.cluster__abnormal} cx={radius * 0.72} cy={-radius * 0.72} r={3.4} />
                      ) : null}
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>
        </div>

        {openMarker ? (
          <div className={styles.popup} style={popupPosition} role="dialog" aria-label={`${openMarker.label} 상세`}>
            <button type="button" className={styles.popup__close} onClick={() => setOpenId(null)} aria-label="팝업 닫기">
              <CloseIcon width={16} height={16} />
            </button>
            {renderPopup(openMarker.data)}
          </div>
        ) : null}

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.controls__button}
            onClick={() => applyZoom(zoom * ZOOM.step)}
            disabled={zoom >= ZOOM.max}
            aria-label="지도 확대"
          >
            <PlusIcon width={16} height={16} />
          </button>
          <button
            type="button"
            className={styles.controls__button}
            onClick={() => applyZoom(zoom / ZOOM.step)}
            disabled={zoom <= ZOOM.min}
            aria-label="지도 축소"
          >
            <MinusIcon width={16} height={16} />
          </button>
          <button type="button" className={styles.controls__button} onClick={reset} aria-label="전체 보기">
            <ExpandIcon width={16} height={16} />
          </button>
        </div>

        <ul className={styles.legend}>
          {(['running', 'degraded', 'fault', 'commLost'] as OperationStatus[]).map((status) => (
            <li key={status} className={styles.legend__item}>
              <span className={styles.legend__dot} style={{ backgroundColor: `var(--${TONE_CLASS[status]})` }} />
              {OPERATION_LABEL[status]}
            </li>
          ))}
        </ul>

        <p className={styles.zoomNote}>×{zoom.toFixed(1)}</p>
      </div>

      <div className={styles.fallback}>
        <button
          type="button"
          className={styles.fallback__toggle}
          onClick={() => setShowTable((prev) => !prev)}
          aria-expanded={showTable}
        >
          {showTable ? '표 접기' : '표로 보기'}
        </button>
        {showTable ? <div className={styles.fallback__body}>{fallback}</div> : null}
      </div>
    </div>
  );
}
