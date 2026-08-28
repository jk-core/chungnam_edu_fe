import { useCallback, useMemo, useRef, useState } from 'react';
import Chungcheongnamdo from '@/assets/geo/provinces/Chungcheongnamdo';
import { CloseIcon, ExpandIcon, MinusIcon, PlusIcon } from '@/components/common/Icon';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { CHUNGNAM_REGIONS } from '@/configs/regions';
import { cn } from '@/utils/cn';
import { useDismissable } from '@/hooks/useDismissable';
import type { OperationStatus } from '@/interface/status';
import type { School } from '@/interface/energy';
import { clusterMarkers } from './clusterMarkers';
import styles from './GeoMap.module.scss';
import { MAP_FIT, MAP_VIEW, projectPoint } from './useMapProjection';
import type { MapMarkerDatum } from './clusterMarkers';
import type { GeoMapProps } from './types';

const ZOOM = { min: 1, max: 6, step: 1.6 };
// 초기 배율에서는 시·군 하나가 한 묶음이 되도록 넉넉히 잡는다. 확대하면 칸이 좁아져 흩어진다.
const CLUSTER_CELL = 58;

/** 묶음이 클수록 한 번에 더 크게 열어야 한 번 눌러 흩어진다. */
function stepFor(count: number): number {
  if (count >= 12) return ZOOM.step ** 2;

  return ZOOM.step;
}

const TONE_CLASS: Record<OperationStatus, string> = {
  running: 'ok',
  ready: 'brand',
  degraded: 'caution',
  fault: 'critical',
  commLost: 'offline',
};

/**
 * 내장 충청남도 설비 지도 (SFR-007-05~10).
 * 실제 행정경계 위에 발전소를 위경도로 투영해 찍는다.
 * 경계 경로와 마커에 같은 변환을 걸어 두 층이 어긋나지 않게 한다.
 *
 * 카카오맵 키가 없거나 외부망이 막힌 자리에서 쓰는 기본 지도다 ([useKakaoMaps]).
 */
export function SvgGeoMap({ plants, renderPopup, selectedId, onSelect, height = 460, fallback }: GeoMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [openId, setOpenId] = useState<string | null>(null);
  // 묶음을 눌렀을 때 옆으로 미끄러져 들어오는 발전소 목록
  const [clusterList, setClusterList] = useState<School[] | null>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const clusterRef = useRef<HTMLElement>(null);

  // 지도의 빈 자리를 누르거나 ESC 를 치면 접는다 — 닫기 단추까지 가지 않아도 되게 한다.
  const closePopup = useCallback(() => setOpenId(null), []);
  const closeCluster = useCallback(() => setClusterList(null), []);

  useDismissable(openId !== null, popupRef, closePopup);
  useDismissable(clusterList !== null, clusterRef, closeCluster);

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
    () => CHUNGNAM_REGIONS.map((region) => ({ code: region.code, name: region.name, ...projectPoint(region.center) })),
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
    setClusterList(null);
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

  /*
    테두리 굵기도 글자와 같은 배율로 되돌린다.
    CSS 에 stroke-width 를 두면 그 값은 로컬 좌표 단위라 맞춤·확대 배율을 그대로 얻어맞는다 —
    글자만 배율을 되돌리고 테두리는 두면 테두리가 글자보다 굵어져 획을 통째로 삼킨다.
  */
  const labelStyle = { fontSize: `${11 * markerScale}px`, strokeWidth: 2.5 * markerScale };

  /** 원본 좌표를 화면 비율로 옮긴다. 팝업을 마커 위에 얹을 때 쓴다. */
  const toRatio = (value: number, axis: 'x' | 'y') => {
    const offset = axis === 'x' ? MAP_FIT.x : MAP_FIT.y;
    const size = axis === 'x' ? MAP_VIEW.width : MAP_VIEW.height;

    return (value * MAP_FIT.scale + offset) / size;
  };

  /**
   * 한 지점을 화면 가운데로 끌어오며 확대한다 (SFR-007-10).
   * 가운데 기준으로만 키우면 누른 묶음이 화면 밖으로 밀려 "확대가 안 된" 것처럼 보인다.
   */
  const focusOn = (x: number, y: number, nextZoom: number) => {
    const clamped = Math.min(ZOOM.max, Math.max(ZOOM.min, nextZoom));
    const limit = (clamped - 1) * 0.5;
    const targetX = -clamped * (toRatio(x, 'x') - 0.5);
    const targetY = -clamped * (toRatio(y, 'y') - 0.5);

    setZoom(clamped);
    setPan({
      x: Math.max(-limit, Math.min(limit, targetX)),
      y: Math.max(-limit, Math.min(limit, targetY)),
    });
  };

  /** 묶음을 누르면 그 자리로 확대하면서 옆에 목록을 편다. */
  const openCluster = (cluster: { x: number; y: number; members: MapMarkerDatum<School>[] }) => {
    focusOn(cluster.x, cluster.y, zoom * stepFor(cluster.members.length));
    setClusterList(cluster.members.map((member) => member.data));
    setOpenId(null);
  };

  return (
    <div className={styles.shell}>
      <div className={styles.map} style={{ minHeight: height }}>
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
            aria-label={`충청남도 발전소 ${plants.length}개소 위치 지도. 같은 내용을 아래 표로도 읽을 수 있습니다.`}
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

                {/*
                  라벨은 두 번 그린다 — 테두리를 전부 깔고 그 위에 글자를 얹는다.
                  paint-order 로 한 번에 그리면 테두리와 채움이 글리프마다 번갈아 칠해져,
                  뒷 글자의 흰 테두리가 앞 글자를 덮는다. 글자 폭이 꽉 찬 한글에서 특히 심하다.
                */}
                {regionPoints.map((region) => (
                  <text
                    key={region.code}
                    className={styles.region__halo}
                    x={region.x}
                    y={region.y - 8 * markerScale}
                    style={labelStyle}
                  >
                    {region.name}
                  </text>
                ))}
                {regionPoints.map((region) => (
                  <text
                    key={region.code}
                    className={styles.region__label}
                    x={region.x}
                    y={region.y - 8 * markerScale}
                    style={labelStyle}
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
                      aria-label={`발전소 ${cluster.members.length}개소 묶음${abnormalCount > 0 ? `, 이상 ${abnormalCount}개소` : ''}. 누르면 그 자리로 확대합니다.`}
                      onClick={() => openCluster(cluster)}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return;

                        event.preventDefault();
                        openCluster(cluster);
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

        {clusterList ? (
          <aside ref={clusterRef} className={styles.clusterList} aria-label={`이 자리 발전소 ${clusterList.length}개소`}>
            <header className={styles.clusterList__head}>
              <p className={styles.clusterList__title}>
                이 자리 발전소
                <span className={styles.clusterList__count}>{clusterList.length}</span>
              </p>
              <button
                type="button"
                className={styles.clusterList__close}
                aria-label="목록 닫기"
                onClick={() => setClusterList(null)}
              >
                <CloseIcon width={15} height={15} />
              </button>
            </header>

            <ul className={styles.clusterList__body}>
              {clusterList.map((plant) => (
                <li key={plant.id}>
                  <button
                    type="button"
                    className={styles.clusterList__item}
                    onClick={() => {
                      setClusterList(null);
                      onSelect?.(plant);
                    }}
                  >
                    <span className={cn(styles.clusterList__dot, styles[`dot--${TONE_CLASS[plant.status]}`])} />
                    <span className={styles.clusterList__name}>{plant.name}</span>
                    <span className={styles.clusterList__meta}>{plant.regionName}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
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
        {/* 고른 발전소 설명은 누를 때만 지도 위로 얹힌다 (SFR-007-06~09) */}
        {openMarker ? (
          <aside ref={popupRef} className={styles.side} aria-label={`${openMarker.label} 상세`}>
            <button
              type="button"
              className={styles.side__close}
              onClick={() => setOpenId(null)}
              aria-label="설명 닫기"
            >
              <CloseIcon width={16} height={16} />
            </button>
            {renderPopup(openMarker.data)}
          </aside>
        ) : null}
      </div>

      {/* 화면에는 띄우지 않지만 스크린리더·인쇄에는 같은 내용을 남긴다 (COR-003). */}
      <div className={styles.srOnly}>{fallback}</div>
    </div>
  );
}
