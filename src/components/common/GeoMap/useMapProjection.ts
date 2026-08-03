import type { GeoPoint } from '@/interface/energy';

export interface GeoBounds {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

/**
 * 충청남도 경계 경로가 차지하는 원본 좌표 상자.
 * 브라우저에서 getBBox() 로 실측한 값이다.
 */
export const CHUNGNAM_PATH_BBOX = { x: 137, y: 156, width: 105, height: 90 };

/** 그 경로가 덮는 실제 위경도 범위. 태안 서쪽 끝부터 금산 동쪽 끝까지. */
export const CHUNGNAM_BOUNDS: GeoBounds = {
  minLng: 126.12,
  maxLng: 127.56,
  minLat: 35.97,
  maxLat: 37.05,
};

/** 지도를 그릴 화면 좌표계 */
export const MAP_VIEW = { width: 480, height: 420, pad: 18 };

/**
 * 경계 경로를 화면 좌표계에 꽉 채우는 변환.
 * 경로와 마커에 같은 변환을 걸어야 둘이 어긋나지 않는다.
 */
export const MAP_FIT = (() => {
  const scale = Math.min(
    (MAP_VIEW.width - MAP_VIEW.pad * 2) / CHUNGNAM_PATH_BBOX.width,
    (MAP_VIEW.height - MAP_VIEW.pad * 2) / CHUNGNAM_PATH_BBOX.height,
  );
  const drawnWidth = CHUNGNAM_PATH_BBOX.width * scale;
  const drawnHeight = CHUNGNAM_PATH_BBOX.height * scale;

  return {
    scale: Math.round(scale * 1000) / 1000,
    x: Math.round(((MAP_VIEW.width - drawnWidth) / 2 - CHUNGNAM_PATH_BBOX.x * scale) * 100) / 100,
    y: Math.round(((MAP_VIEW.height - drawnHeight) / 2 - CHUNGNAM_PATH_BBOX.y * scale) * 100) / 100,
  };
})();

/**
 * 위경도를 경계 경로와 같은 원본 좌표로 옮긴다.
 * 경로가 이미 투영된 좌표라, 경계 상자의 네 귀퉁이에 위경도 범위를 맞춰 선형으로 대응시킨다.
 */
export function projectPoint(point: GeoPoint): { x: number; y: number } {
  const lngRatio = (point.lng - CHUNGNAM_BOUNDS.minLng) / (CHUNGNAM_BOUNDS.maxLng - CHUNGNAM_BOUNDS.minLng);
  const latRatio = (point.lat - CHUNGNAM_BOUNDS.minLat) / (CHUNGNAM_BOUNDS.maxLat - CHUNGNAM_BOUNDS.minLat);

  return {
    x: Math.round((CHUNGNAM_PATH_BBOX.x + lngRatio * CHUNGNAM_PATH_BBOX.width) * 100) / 100,
    // 위도는 위로 갈수록 커지지만 화면은 아래로 갈수록 커진다.
    y: Math.round((CHUNGNAM_PATH_BBOX.y + (1 - latRatio) * CHUNGNAM_PATH_BBOX.height) * 100) / 100,
  };
}
