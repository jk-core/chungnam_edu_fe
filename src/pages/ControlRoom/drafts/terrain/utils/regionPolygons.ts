import { REGION_BOUNDS, REGION_BOX, REGION_SHAPES } from '@/assets/geo/chungnamRegions';

/**
 * 시·군 도형을 실제 지도 위의 경계선으로 옮긴다 (2026-09-14 지시).
 *
 * 이 저장소에는 시·군 경계의 위경도 자료가 없고 `REGION_SHAPES` 의 SVG 경로뿐이다. 그런데
 * 그 경로가 놓인 판과 실제 위경도의 대응은 이미 실측으로 맞춰져 있다 — `REGION_BOUNDS` 의
 * 주석대로 **마스터 표 318개소의 좌표를 찍어 보고 자기 시·군 면에 드는 개소가 가장 많아지는
 * 값**으로 잡은 것이다. 그 대응을 거꾸로 돌리면 도형의 점이 위경도가 된다.
 *
 * 정확한 행정구역 자료를 들여오는 것이 정공법이지만, 파일이 늘고 출처·라이선스를 따져야 한다.
 * 견줌용 시안이 답해야 할 물음은 「실제 지도 위에서 시·군이 갈려 보이는가」 하나뿐이므로
 * 가지고 있는 것으로 먼저 답한다.
 *
 * **이 경계는 실제 행정구역 경계가 아니다.** 원본이 위키미디어 SVG 라 해안선이 단순화돼
 * 있어, 섬과 갯벌이 많은 서해안에서는 실제 해안선과 어긋난다. 시·군을 가르는 눈금으로만 쓰고
 * 면적·소속을 따지는 데 쓰지 않는다.
 */

/** 지도에 얹을 시·군 하나의 경계 */
export interface RegionOutline {
  name: string;
  path: { lat: number; lng: number }[];
}

/**
 * 경계를 몇 점으로 훑을지.
 *
 * 판 좌표 3px 마다 한 점이면 시·군 하나가 대략 100~400점이 된다. 더 촘촘히 뽑아도 화면에서
 * 달라 보이지 않으면서 열다섯 시·군을 합친 점이 배로 늘어 지도를 움직일 때 버벅인다.
 */
const STEP = 3;

/** `transform="translate(x,y)"` 하나만 쓰인다 — 원본에서 지우지 못한 이동이다 */
function parseTranslate(transform?: string): { x: number; y: number } {
  if (!transform) return { x: 0, y: 0 };

  const matched = /translate\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/.exec(transform);

  return matched ? { x: Number(matched[1]), y: Number(matched[2]) } : { x: 0, y: 0 };
}

/**
 * 판 좌표 한 점을 위경도로.
 * 위도는 위로 갈수록 커지지만 판은 아래로 갈수록 커지므로 세로만 뒤집는다.
 */
function toLatLng(x: number, y: number) {
  const lngRatio = (x - REGION_BOX.x) / REGION_BOX.width;
  const latRatio = (y - REGION_BOX.y) / REGION_BOX.height;

  return {
    lng: REGION_BOUNDS.minLng + lngRatio * (REGION_BOUNDS.maxLng - REGION_BOUNDS.minLng),
    lat: REGION_BOUNDS.maxLat - latRatio * (REGION_BOUNDS.maxLat - REGION_BOUNDS.minLat),
  };
}

/**
 * 시·군 경계 점렬.
 *
 * 경로의 길이를 재고 그 위를 일정 간격으로 훑는 일은 브라우저만 할 수 있어(`getPointAtLength`),
 * 화면 밖에 판 하나를 세워 두고 경로를 갈아 끼우며 잰다. 판을 경로마다 새로 만들면 열다섯 번
 * 붙였다 떼게 되므로 하나만 만들어 돌려 쓴다.
 */
function buildOutlines(): RegionOutline[] {
  if (typeof document === 'undefined') return [];

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.style.visibility = 'hidden';
  svg.appendChild(path);
  document.body.appendChild(svg);

  try {
    return REGION_SHAPES.map((shape) => {
      const shift = parseTranslate(shape.transform);

      path.setAttribute('d', shape.d);

      const length = path.getTotalLength();
      const points: { lat: number; lng: number }[] = [];

      for (let at = 0; at < length; at += STEP) {
        const point = path.getPointAtLength(at);

        points.push(toLatLng(point.x + shift.x, point.y + shift.y));
      }

      return { name: shape.region, path: points };
    });
  } finally {
    svg.remove();
  }
}

let cached: RegionOutline[] | null = null;

/**
 * 시·군 경계 점렬. 처음 부를 때 한 번만 뽑고 그 뒤로는 같은 것을 돌려준다.
 *
 * 열다섯 경로를 훑는 셈이라 화면을 그릴 때마다 하면 시·군을 고를 때마다 지도가 멎는다.
 */
export function getRegionOutlines(): RegionOutline[] {
  cached ??= buildOutlines();

  return cached;
}
