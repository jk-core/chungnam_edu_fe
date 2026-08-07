import { useEffect, useMemo, useRef, useState } from 'react';
import { CloseIcon } from '@/components/common/Icon';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { cn } from '@/utils/cn';
import type { OperationStatus } from '@/interface/status';
import type { School } from '@/interface/energy';
import { clusterMarkers } from './clusterMarkers';
import styles from './GeoMap.module.scss';
import type { MapCluster, MapMarkerDatum } from './clusterMarkers';
import type { GeoMapProps } from './types';

/** 충청남도가 화면에 꽉 차는 지점 */
const CENTER = { lat: 36.58, lng: 126.85 };
const DEFAULT_ZOOM = 9;
const ZOOM_RANGE = { min: 8, max: 16 };

/** 묶음 격자 한 칸(경위도). 확대하면 clusterMarkers 가 같은 규칙으로 잘게 나눈다. */
const CLUSTER_CELL = 0.6;

/** 이 안에 지도가 한 겹도 그려지지 않으면 못 쓰는 것으로 본다. */
const PAINT_TIMEOUT = 1600;

const TONE_CLASS: Record<OperationStatus, string> = {
  running: 'ok',
  ready: 'brand',
  degraded: 'caution',
  fault: 'critical',
  commLost: 'offline',
};

interface NaverGeoMapProps extends GeoMapProps {
  /** 지도가 끝내 그려지지 않을 때 부른다. 부르는 쪽이 내장 지도로 되돌린다. */
  onUnavailable: () => void;
}

/**
 * 네이버 지도 위에 발전소를 찍는다 (SFR-007-05~10).
 * 묶음 계산은 내장 SVG 지도와 같은 `clusterMarkers` 를 쓴다 — 두 지도가 같은 규칙으로 흩어져야
 * 어느 쪽을 보든 읽는 법이 같다.
 */
export function NaverGeoMap({
  plants,
  renderPopup,
  selectedId,
  onSelect,
  height = 460,
  fallback,
  onUnavailable,
}: NaverGeoMapProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [openPlant, setOpenPlant] = useState<School | null>(null);
  const [clusterList, setClusterList] = useState<School[] | null>(null);

  const markers = useMemo<MapMarkerDatum<School>[]>(
    () => plants.map((plant) => ({
      id: plant.id,
      // 화면 좌표가 아니라 경위도를 그대로 격자에 넣는다 — 실제 위치로 묶인다.
      x: plant.location.lng,
      y: plant.location.lat,
      tone: OPERATION_TONE[plant.status],
      label: plant.name,
      data: plant,
    })),
    [plants],
  );

  const clusters = useMemo(
    () => clusterMarkers(markers, 2 ** (zoom - DEFAULT_ZOOM), CLUSTER_CELL),
    [markers, zoom],
  );

  // 지도는 한 번만 만든다. 마커는 아래 effect 가 갈아 끼운다.
  useEffect(() => {
    const holder = holderRef.current;
    const maps = window.naver?.maps;

    if (!holder) return;

    // 키가 거부되면 SDK 가 스스로 `naver.maps` 를 비운다. 빈 상자를 남기느니 내장 지도로 돌아간다.
    if (!maps) {
      onUnavailable();

      return;
    }

    let map: naver.maps.Map;
    let listener: unknown;

    try {
      map = new maps.Map(holder, {
        center: new maps.LatLng(CENTER.lat, CENTER.lng),
        zoom: DEFAULT_ZOOM,
        minZoom: ZOOM_RANGE.min,
        maxZoom: ZOOM_RANGE.max,
        mapDataControl: false,
        logoControl: false,
        scaleControl: false,
      });
      listener = maps.Event.addListener(map, 'zoom_changed', () => setZoom(map.getZoom()));
    } catch {
      // 인증이 막히면 SDK 는 껍데기만 남기고 속을 비운다. 그 상태로 부르면 던진다.
      onUnavailable();

      return;
    }

    mapRef.current = map;

    // 타일 한 장 그려지지 않으면 인증이 막힌 것이다 — 그때도 내장 지도로 돌아간다.
    const watchdog = window.setTimeout(() => {
      if (!holder.firstElementChild) onUnavailable();
    }, PAINT_TIMEOUT);

    return () => {
      window.clearTimeout(watchdog);
      mapRef.current = null;

      try {
        maps.Event.removeListener(listener);
        map.destroy();
      } catch {
        // 이미 무너진 SDK 를 정리하다 난 오류다. 화면까지 무너뜨릴 이유는 없다.
      }
    };
  }, [onUnavailable]);

  // 묶음이 바뀌면 마커를 다시 그린다.
  useEffect(() => {
    const map = mapRef.current;
    const maps = window.naver?.maps;

    if (!map || !maps) return;

    const openCluster = (cluster: MapCluster<School>) => {
      // 누른 자리를 가운데로 끌어오면서 확대한다. 그대로 두면 묶음이 화면 밖으로 밀린다.
      map.setCenter(new maps.LatLng(cluster.y, cluster.x));
      map.setZoom(Math.min(ZOOM_RANGE.max, map.getZoom() + 2), true);
      setClusterList(cluster.members.map((member) => member.data));
      setOpenPlant(null);
    };

    const drawn: naver.maps.Marker[] = [];

    try {
      clusters.forEach((cluster) => {
        const single = cluster.members.length === 1 ? cluster.members[0] : null;
        const abnormal = cluster.members.filter((item) => isAbnormal(item.data.status)).length;

        const marker = new maps.Marker({
          position: new maps.LatLng(cluster.y, cluster.x),
          map,
          title: single
            ? `${single.data.name}, ${single.data.regionName}, ${OPERATION_LABEL[single.data.status]}`
            : `발전소 ${cluster.members.length}개소 묶음`,
          zIndex: single ? 10 : 20,
          icon: {
            content: single
              ? markerHtml(single.data, single.data.id === selectedId)
              : clusterHtml(cluster.members.length, abnormal),
            anchor: new maps.Point(14, 14),
          },
        });

        maps.Event.addListener(marker, 'click', () => {
          if (!single) {
            openCluster(cluster);

            return;
          }

          setOpenPlant(single.data);
          onSelect?.(single.data);
        });

        drawn.push(marker);
      });
    } catch {
      onUnavailable();
    }

    markersRef.current = drawn;

    return () => {
      try {
        drawn.forEach((marker) => marker.setMap(null));
      } catch {
        // 이미 무너진 SDK 를 정리하다 난 오류다. 화면까지 무너뜨릴 이유는 없다.
      }
    };
  }, [clusters, selectedId, onSelect, onUnavailable]);

  return (
    <div>
      <div className={styles.map} style={{ height }}>
        <div ref={holderRef} className={styles.naver} />

        {clusterList ? (
          <aside className={styles.clusterList} aria-label={`이 자리 발전소 ${clusterList.length}개소`}>
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
                      setOpenPlant(plant);
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

        {/*
          마커 위에 말풍선을 띄우려면 지도 투영을 직접 계산해야 하고, 지도를 움직일 때마다 어긋난다.
          내용은 그대로 두고 자리만 왼쪽 아래로 고정한다.
        */}
        {openPlant ? (
          <div className={styles.popupDock} role="dialog" aria-label={`${openPlant.name} 상세`}>
            <button
              type="button"
              className={styles.popup__close}
              onClick={() => setOpenPlant(null)}
              aria-label="팝업 닫기"
            >
              <CloseIcon width={16} height={16} />
            </button>
            {renderPopup(openPlant)}
          </div>
        ) : null}

        <ul className={styles.legend}>
          {(['running', 'degraded', 'fault', 'commLost'] as OperationStatus[]).map((status) => (
            <li key={status} className={styles.legend__item}>
              <span className={styles.legend__dot} style={{ backgroundColor: `var(--${TONE_CLASS[status]})` }} />
              {OPERATION_LABEL[status]}
            </li>
          ))}
        </ul>
      </div>

      {/* 화면에는 띄우지 않지만 스크린리더·인쇄에는 같은 내용을 남긴다 (COR-003). */}
      <div className={styles.srOnly}>{fallback}</div>
    </div>
  );
}

/** 마커 하나 — 상태색 점. 지도 SDK 는 HTML 문자열만 받는다. */
function markerHtml(plant: School, selected: boolean): string {
  const tone = TONE_CLASS[plant.status];
  const ring = isAbnormal(plant.status) ? '<i class="nvMarker__ring"></i>' : '';
  const selectedClass = selected ? ' nvMarker--selected' : '';

  return `<span class="nvMarker nvMarker--${tone}${selectedClass}">${ring}<i class="nvMarker__dot"></i></span>`;
}

/** 묶음 — 개수와, 이상이 섞여 있으면 붉은 점 하나 (색에만 기대지 않게) */
function clusterHtml(count: number, abnormal: number): string {
  const flag = abnormal > 0 ? '<i class="nvCluster__flag"></i>' : '';

  return `<span class="nvCluster">${count}${flag}</span>`;
}
