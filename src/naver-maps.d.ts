/**
 * 네이버 지도 SDK 중 이 프로젝트가 실제로 쓰는 부분만 좁게 선언한다.
 * 공식 타입 패키지를 붙이면 목업 단계에 필요 없는 의존이 하나 늘어난다.
 */
declare namespace naver.maps {
  class Point {
    constructor(x: number, y: number);
    x: number;
    y: number;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  interface MapOptions {
    center: LatLng;
    zoom: number;
    minZoom?: number;
    maxZoom?: number;
    mapDataControl?: boolean;
    scaleControl?: boolean;
    logoControl?: boolean;
    zoomControl?: boolean;
  }

  class Map {
    constructor(element: HTMLElement | string, options: MapOptions);
    setCenter(latlng: LatLng): void;
    setZoom(zoom: number, animate?: boolean): void;
    getZoom(): number;
    destroy(): void;
  }

  interface MarkerOptions {
    position: LatLng;
    map?: Map;
    title?: string;
    zIndex?: number;
    icon?: { content: string; anchor?: Point };
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
  }

  namespace Event {
    function addListener(target: unknown, type: string, handler: () => void): unknown;
    function removeListener(listener: unknown): void;
  }
}

interface Window {
  naver?: {
    maps?: typeof naver.maps;
  };
  /** 네이버 지도가 인증에 실패하면 이 전역 함수를 부른다. */
  navermap_authFailure?: () => void;
}
