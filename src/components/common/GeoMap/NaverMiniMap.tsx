import { useEffect, useRef } from 'react';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import type { School } from '@/interface/energy';
import styles from './GeoMap.module.scss';

const CENTER = { lat: 36.58, lng: 126.85 };
const DEFAULT_ZOOM = 9;
/** 이 안에 지도가 한 겹도 그려지지 않으면 못 쓰는 것으로 본다. */
const PAINT_TIMEOUT = 1600;

interface NaverMiniMapProps {
  /** 이미 걸러 넘긴 발전소. 미니맵은 받은 것을 그대로 다 찍는다. */
  plants: School[];
  height: number;
  label: string;
  /** 지도가 끝내 그려지지 않을 때 부른다. 부르는 쪽이 내장 지도로 되돌린다. */
  onUnavailable: () => void;
}

/**
 * 상황판 한 칸에 들어가는 작은 네이버 지도 (SFR-004-01/14).
 * 묶음·팝업·확대 버튼 없이 위치만 찍는다 — 상황판은 훑어보는 화면이지 파고드는 화면이 아니다.
 */
export function NaverMiniMap({ plants, height, label, onUnavailable }: NaverMiniMapProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<naver.maps.Map | null>(null);

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

    try {
      map = new maps.Map(holder, {
        center: new maps.LatLng(CENTER.lat, CENTER.lng),
        zoom: DEFAULT_ZOOM,
        mapDataControl: false,
        logoControl: false,
        scaleControl: false,
        zoomControl: false,
      });
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
        map.destroy();
      } catch {
        // 이미 무너진 SDK 를 정리하다 난 오류다. 화면까지 무너뜨릴 이유는 없다.
      }
    };
  }, [onUnavailable]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = window.naver?.maps;

    if (!map || !maps) return;

    const markers: naver.maps.Marker[] = [];

    try {
      plants.forEach((plant) => markers.push(new maps.Marker({
        position: new maps.LatLng(plant.location.lat, plant.location.lng),
        map,
        title: `${plant.name} · ${OPERATION_LABEL[plant.status]}`,
        icon: {
          content: `<span class="nvMarker nvMarker--${OPERATION_TONE[plant.status]}">${isAbnormal(plant.status) ? '<i class="nvMarker__ring"></i>' : ''}<i class="nvMarker__dot"></i></span>`,
          anchor: new maps.Point(14, 14),
        },
      })));
    } catch {
      onUnavailable();
    }

    return () => {
      try {
        markers.forEach((marker) => marker.setMap(null));
      } catch {
        // 이미 무너진 SDK 를 정리하다 난 오류다. 화면까지 무너뜨릴 이유는 없다.
      }
    };
  }, [plants, onUnavailable]);

  return <div ref={holderRef} className={styles.mini} style={{ height }} role="img" aria-label={label} />;
}
