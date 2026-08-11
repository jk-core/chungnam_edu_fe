/**
 * 카카오맵 SDK 중 이 프로젝트가 실제로 쓰는 부분만 좁게 선언한다.
 * 공식 타입 패키지를 붙이면 목업 단계에 필요 없는 의존이 하나 늘어난다.
 */
declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class LatLngBounds {
    constructor();
    extend(latlng: LatLng): void;
    isEmpty(): boolean;
  }

  interface MapOptions {
    center: LatLng;
    /**
     * 확대 단계. 네이버·구글의 zoom 과 반대로 **작을수록 크게 보인다**.
     * 1 이 가장 가깝고 14 가 가장 멀다.
     */
    level: number;
    draggable?: boolean;
    scrollwheel?: boolean;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    /** 중심을 부드럽게 옮긴다. 멀면 카카오가 알아서 건너뛴다 */
    panTo(latlng: LatLng): void;
    getCenter(): LatLng;
    setLevel(level: number, options?: { animate?: boolean | { duration: number }; anchor?: LatLng }): void;
    getLevel(): number;
    setMinLevel(level: number): void;
    setMaxLevel(level: number): void;
    setBounds(
      bounds: LatLngBounds,
      paddingTop?: number,
      paddingRight?: number,
      paddingBottom?: number,
      paddingLeft?: number,
    ): void;
    relayout(): void;
  }

  interface CustomOverlayOptions {
    position: LatLng;
    content: HTMLElement | string;
    map?: Map | null;
    /** 0 이면 왼쪽·위 끝, 0.5 면 가운데 */
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
    /** content 안쪽이 클릭·드래그 이벤트를 받게 한다 */
    clickable?: boolean;
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
    setPosition(latlng: LatLng): void;
  }

  namespace event {
    function addListener(target: unknown, type: string, handler: (...args: unknown[]) => void): void;
    function removeListener(target: unknown, type: string, handler: (...args: unknown[]) => void): void;
  }

  /** `autoload=false` 로 실었을 때, 준비가 끝나면 부른다. */
  function load(callback: () => void): void;
}

interface Window {
  kakao?: {
    maps?: typeof kakao.maps;
  };
}
