import { CHUNGNAM_PATH_BBOX, projectPoint } from '@/components/common/GeoMap/useMapProjection';
import { REGIONS } from '@/mocks/regions';

interface Point {
  x: number;
  y: number;
}

export interface RegionCell {
  code: string;
  name: string;
  center: Point;
  /** 경계 다각형 — 도 모양으로 잘라 낼 것을 전제로 넉넉히 그린다 */
  polygon: Point[];
}

/**
 * 자를 바탕 상자.
 * 도 경로 밖까지 넉넉히 잡는다 — 어차피 도 모양으로 오려 내므로 넘치는 쪽이 안전하다.
 */
const FRAME: Point[] = (() => {
  const pad = 40;
  const { x, y, width, height } = CHUNGNAM_PATH_BBOX;

  return [
    { x: x - pad, y: y - pad },
    { x: x + width + pad, y: y - pad },
    { x: x + width + pad, y: y + height + pad },
    { x: x - pad, y: y + height + pad },
  ];
})();

/**
 * 두 중심의 수직이등분선으로 다각형을 자른다.
 * 남기는 쪽은 `site` 에 더 가까운 편이다.
 */
function clipByBisector(polygon: Point[], site: Point, other: Point): Point[] {
  // 2(other - site)·p = |other|² - |site|² 위쪽이면 other 에 더 가깝다.
  const nx = 2 * (other.x - site.x);
  const ny = 2 * (other.y - site.y);
  const c = other.x ** 2 + other.y ** 2 - site.x ** 2 - site.y ** 2;
  const side = (p: Point) => nx * p.x + ny * p.y - c;

  const out: Point[] = [];

  polygon.forEach((current, index) => {
    const previous = polygon[(index + polygon.length - 1) % polygon.length];
    const currentSide = side(current);
    const previousSide = side(previous);

    if (currentSide <= 0) {
      // 앞 꼭짓점이 밖이었다면 경계에서 만난 점을 먼저 넣는다.
      if (previousSide > 0) {
        const t = previousSide / (previousSide - currentSide);

        out.push({ x: previous.x + (current.x - previous.x) * t, y: previous.y + (current.y - previous.y) * t });
      }

      out.push(current);
    } else if (previousSide <= 0) {
      const t = previousSide / (previousSide - currentSide);

      out.push({ x: previous.x + (current.x - previous.x) * t, y: previous.y + (current.y - previous.y) * t });
    }
  });

  return out;
}

/**
 * 지역별 경계 근사 (SFR-004-01).
 *
 * 시·군 경계 좌표는 이 목업에 없다 — 가진 것은 도 전체 실루엣과 지역 중심점뿐이다. 그래서
 * 중심점에서 같은 거리인 선으로 도를 나눈다(보로노이). 실제 행정경계와 정확히 같지는 않지만
 * 「어느 지역이 어디쯤인가」 를 보여 주기에는 충분하고, 도 모양으로 오려 내므로 바깥으로
 * 삐져나가지도 않는다. 실제 경계 데이터가 들어오면 이 파일만 갈아 끼우면 된다.
 */
export const REGION_CELLS: RegionCell[] = REGIONS.map((region) => {
  const center = projectPoint(region.center);
  const polygon = REGIONS.reduce<Point[]>((shape, other) => (
    other.code === region.code ? shape : clipByBisector(shape, center, projectPoint(other.center))
  ), FRAME);

  return { code: region.code, name: region.name, center, polygon };
});

/** 다각형을 SVG 경로 문자열로 */
export function pathOf(polygon: Point[]): string {
  if (polygon.length === 0) return '';

  return `${polygon.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')}Z`;
}
