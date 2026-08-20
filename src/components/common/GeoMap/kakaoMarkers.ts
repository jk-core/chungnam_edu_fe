import type { OperationStatus } from '@/interface/status';

/*
  카카오맵이 쓰는 값들.

  마커 겉모습은 `PlantMapLayer` 가 JSX 로 그린다 — `react-kakao-maps-sdk` 의 `CustomOverlayMap`
  안쪽이 그대로 리액트 트리라, 지도 SDK 에 HTML 문자열을 넘기던 시절과 달리 CSS 모듈이 닿는다.
  여기에는 두 지도(홈·미니맵)가 나눠 쓰는 숫자와 색 이름만 남긴다.
*/

/** 상태 → 색 토큰 이름. 내장 SVG 지도와 같은 색을 쓴다. */
export const TONE_CLASS: Record<OperationStatus, string> = {
  running: 'ok',
  ready: 'brand',
  degraded: 'caution',
  fault: 'critical',
  commLost: 'offline',
};

/** 충청남도가 화면에 꽉 차는 지점 */
export const CENTER = { lat: 36.58, lng: 126.85 };

/**
 * 확대 단계. 카카오는 숫자가 **작을수록 크게** 보인다.
 * 11 이면 도 전체가 한 화면에 들어온다.
 */
export const DEFAULT_LEVEL = 11;

/**
 * 한 곳만 볼 때의 배율.
 *
 * 이 정도면 둘레에 다른 발전소가 없어 묶음으로 뭉치지 않고 그 학교 하나만 남는다.
 * 더 당기면 주변 지형이 사라져 어디인지 알 수 없고, 덜 당기면 옆 학교와 다시 묶인다.
 */
export const FOCUS_LEVEL = 5;

/**
 * 묶음을 펼칠 때 가장자리에 두는 여백(px).
 * 딱 맞춰 담으면 화면 끝에 걸린 마커의 이름표가 잘린다.
 */
export const FIT_PADDING = 56;

/*
  묶음 격자 한 칸(경위도). 확대하면 clusterMarkers 가 같은 규칙으로 잘게 나눈다.

  칸이 화면에서 차지하는 폭은 확대 단계와 무관하게 일정하다 — 한 단계 확대하면 칸도 절반으로
  잘리기 때문이다. 그래서 이름표 하나가 들어갈 만큼(약 100px)으로 잡아 두면, 어느 배율에서든
  이름표가 서로 겹치지 않는다. 이 값이 크면 도 전체가 서너 덩이로 뭉쳐 이름이 아예 안 보인다.
*/
export const CLUSTER_CELL = 0.2;

/**
 * 묶음에 든 발전소가 모두 화면에 들어오도록 지도를 맞춘다.
 *
 * 무게중심으로 옮기고 한 단계 확대하는 방식은 두 가지로 어긋났다.
 * 넓게 퍼진 묶음은 한 단계로 풀리지 않아 몇 번을 눌러야 했고, 중심만 맞추다 보니
 * 가장자리 발전소는 화면 밖에 남았다. 담을 자리를 알려 주면 카카오가 중심과 배율을
 * 한 번에 잡아 준다 — 누른 묶음이 곧바로, 통째로 보인다.
 */
export function fitToCluster(map: kakao.maps.Map, points: { x: number; y: number }[]): void {
  if (points.length === 0) return;

  const bounds = new kakao.maps.LatLngBounds();

  points.forEach((point) => bounds.extend(new kakao.maps.LatLng(point.y, point.x)));

  map.setBounds(bounds, FIT_PADDING, FIT_PADDING, FIT_PADDING, FIT_PADDING);
}

/**
 * 누른 발전소를 지도 한가운데로 데려온다.
 *
 * 가장자리에 있던 마커를 누르면 설명은 뜨는데 정작 그 점이 어디 있었는지 눈에서 놓친다.
 * 가운데로 옮겨 두면 설명과 자리가 같은 시야에 들어온다. `panTo` 는 미끄러지듯 옮기고,
 * 너무 멀면 카카오가 알아서 건너뛴다.
 */
export function centerOn(map: kakao.maps.Map, point: { lat: number; lng: number }): void {
  map.panTo(new kakao.maps.LatLng(point.lat, point.lng));
}

/** 다가서는 데 쓰는 시간(ms) — 처음 한 곳을 고를 때만 쓴다 */
const ZOOM_IN_MS = 300;

/** 건너가는 시간 — 가까우면 짧게, 멀면 길게. 속도가 눈에 비슷하게 느껴진다 */
const TRAVEL_MIN_MS = 520;
const TRAVEL_MAX_MS = 1200;

/** 도 끝에서 끝까지의 거리(도) — 가장 긴 걸음이다 */
const LONGEST_SPAN = 1.2;

/** 가다 서다 없이 부드럽게 — 처음과 끝을 느리게 둔다 */
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

/**
 * 한 곳을 가운데 두고 그 곳만 남게 당긴다.
 *
 * `panTo` 는 가까운 거리만 미끄러지고 멀면 그냥 건너뛴다 — 순회가 도 반대편으로 넘어갈 때
 * 화면이 툭 바뀌어, 어디에서 어디로 갔는지 눈이 따라가지 못한다. 그래서 지도를 직접 끈다.
 * 배율은 건드리지 않고 자리만 옮긴다 — 손으로 지도를 끌어 옮기는 것과 같은 움직임이다.
 *
 * 배율을 맞추는 것은 도착한 뒤 한 번뿐이고, 그것도 처음 한 곳을 고를 때(도 전체를 보고 있을 때)
 * 뿐이다. 도는 동안에는 이미 그 배율이라 다시 건드릴 일이 없다.
 *
 * 되돌려 주는 함수를 부르면 가던 길에서 멈춘다 — 순회가 다음 곳으로 넘어갈 때 앞의 움직임을
 * 거둬야 두 움직임이 서로를 밀지 않는다.
 */
export function focusOn(
  map: kakao.maps.Map,
  point: { lat: number; lng: number },
  level = FOCUS_LEVEL,
): () => void {
  const from = map.getCenter();
  const start = { lat: from.getLat(), lng: from.getLng() };
  const span = Math.max(Math.abs(start.lat - point.lat), Math.abs(start.lng - point.lng));
  const travelMs = Math.round(
    TRAVEL_MIN_MS + Math.min(1, span / LONGEST_SPAN) * (TRAVEL_MAX_MS - TRAVEL_MIN_MS),
  );

  let frame = 0;
  const began = performance.now();
  const step = (now: number) => {
    const ratio = Math.min(1, (now - began) / travelMs);
    const eased = easeInOut(ratio);

    map.setCenter(new kakao.maps.LatLng(
      start.lat + (point.lat - start.lat) * eased,
      start.lng + (point.lng - start.lng) * eased,
    ));

    if (ratio < 1) frame = requestAnimationFrame(step);
    else if (map.getLevel() !== level) map.setLevel(level, { animate: { duration: ZOOM_IN_MS } });
  };

  frame = requestAnimationFrame(step);

  return () => cancelAnimationFrame(frame);
}

/** 도 전체가 한눈에 들어오는 처음 자리로 되돌린다 */
export function resetView(map: kakao.maps.Map): void {
  map.setLevel(DEFAULT_LEVEL);
  map.panTo(new kakao.maps.LatLng(CENTER.lat, CENTER.lng));
}
