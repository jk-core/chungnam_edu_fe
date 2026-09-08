import { useSyncExternalStore } from 'react';
import { isAbnormal } from '@/mocks/status';
import type { School } from '@/interface/energy';

/**
 * 시·군 한 곳에 머무는 시간(ms).
 *
 * 두 판이 같은 값을 쓴다 (2026-09-07 지시). 주기가 다르면 순서를 맞춰 놓아도 곧 어긋난다 —
 * 8초와 16초로 돌던 때는 한 바퀴에 두 판이 서로 다른 시·군을 보는 구간이 절반이었다.
 *
 * 긴 쪽에 맞춘다. AI 진단은 브리핑 글이 타자기로 찍히는 데만 4초가 걸려 그보다 짧으면 다 읽지
 * 못한 채 넘어가고, 지도 쪽은 오래 머문다고 잃는 것이 없다.
 */
export const REGION_TOUR_MS = 16_000;

/**
 * 순회할 시·군의 차례.
 *
 * 이상이 많은 곳부터, 같으면 큰 곳부터다. 걸어 두고 지켜보는 화면에서 먼저 비쳐야 할 곳은
 * 손봐야 할 곳이지 지도에서 위에 있는 곳이 아니다.
 *
 * 발전소가 없는 시·군은 빼고 센다. 지도는 열다섯 도형을 모두 그리지만 순회는 볼 것이 있는
 * 곳만 돈다 — 그래야 옆 판(AI 진단)과 같은 목록을 같은 차례로 돌게 된다.
 *
 * 두 판이 각자 셈하던 것을 한 곳으로 모았다. 같은 규칙을 두 곳에 적어 두면 한쪽만 고쳐 놓고
 * 두 판이 다른 시·군을 비추게 된다.
 */
export function orderRegionNames(plants: School[]): string[] {
  const buckets = new Map<string, School[]>();

  plants.forEach((plant) => {
    const bucket = buckets.get(plant.regionName);

    if (bucket) bucket.push(plant);
    else buckets.set(plant.regionName, [plant]);
  });

  return [...buckets.entries()]
    .map(([name, rows]) => ({
      name,
      abnormal: rows.filter((row) => isAbnormal(row.status)).length,
      capacityKw: rows.reduce((sum, row) => sum + row.capacityKw, 0),
    }))
    .sort((a, b) => b.abnormal - a.abnormal || b.capacityKw - a.capacityKw)
    .map((region) => region.name);
}

/** 자리가 넘어갔는지 살피는 간격(ms). 16초 주기에서 이만하면 넘어가는 순간이 눈에 걸리지 않는다 */
const CHECK_MS = 250;

/*
  순회는 판마다 도는 것이 아니라 **하나가 돌고 판들이 본다**.

  처음에는 판마다 시계를 걸었다. 같은 주기를 주어도 재는 방식이 달라(한쪽은 `setInterval`,
  다른 쪽은 자리마다 새로 거는 `setTimeout`) 2분 만에 한 칸이 밀렸다. 시계를 하나로 모아
  그것을 고쳤는데, 이번에는 손으로 옮기는 것이 판마다 따로 놀았다 — 오른쪽에서 다음 지역을
  누르면 오른쪽만 넘어갔다 (2026-09-07 지시).

  자리를 정하는 것 전부를 여기로 옮긴다. 시계도, 손으로 민 만큼도, 멈춰 세운 자리도 하나뿐이다.
  두 판은 그것을 읽고 그리기만 한다 — 같은 것을 보고 있으니 같은 곳이 비치는 것이 당연해진다.
*/
const listeners = new Set<() => void>();
let ticker: number | undefined;

/** 손으로 민 칸 수 */
let offset = 0;

/** 멈춰 세운 자리. `null` 이면 돌고 있다 */
let held: number | null = null;

/** 지금 걸린 자리 */
let slot = slotNow();

/**
 * 바뀔 때마다 오르는 수.
 *
 * `useSyncExternalStore` 의 스냅샷으로 쓴다 — 자리·오프셋·멈춤을 한 덩이로 묶어 내려면
 * 렌더마다 새 객체가 되어 무한히 다시 그린다. 수 하나만 내보내고 값은 렌더 도중에 읽는다.
 */
let version = 0;

/** 1970년부터 몇 번째 자리인지 — 두 판이 같은 시각에서 같은 식으로 셈하므로 답이 하나다 */
function slotNow() {
  return Math.floor(Date.now() / REGION_TOUR_MS);
}

function bump() {
  version += 1;
  listeners.forEach((notify) => notify());
}

function subscribeTour(onChange: () => void) {
  listeners.add(onChange);

  if (ticker === undefined) {
    ticker = window.setInterval(() => {
      const next = slotNow();

      // 자리가 그대로면 아무도 깨우지 않는다 — 250ms 마다 화면을 다시 그릴 까닭이 없다
      if (next === slot) return;

      slot = next;

      // 멈춰 세운 동안에는 시계가 흘러도 화면이 그대로다. 풀 때 쓸 자리만 갱신해 둔다.
      if (held === null) bump();
    }, CHECK_MS);
  }

  return () => {
    listeners.delete(onChange);

    if (listeners.size === 0 && ticker !== undefined) {
      window.clearInterval(ticker);
      ticker = undefined;
    }
  };
}

const getVersion = () => version;

/**
 * 순회 자리 (2026-09-07 지시 — 두 판이 같은 시·군을 보게).
 *
 * 지금 몇 번째 자리인지와 그것을 옮기는 손잡이를 함께 돌려준다. 상태는 이 훅이 아니라 모듈이
 * 쥐고 있으므로, 어느 판에서 옮기든 두 판이 함께 움직인다.
 *
 * `count` 는 판마다 받지만 두 판이 같은 목록(`orderRegionNames`)에서 세므로 같은 값이다.
 * 자리 수를 넘는 값이 들어와도 접어서 쓴다 — 조회 조건이 바뀌어 목록이 줄어드는 순간에도
 * 없는 자리를 가리키지 않는다.
 */
export function useRegionTour(count: number) {
  useSyncExternalStore(subscribeTour, getVersion, getVersion);

  const wrap = (value: number) => (count > 0 ? ((value % count) + count) % count : 0);
  const running = wrap(slot + offset);

  return {
    index: held ?? running,
    isPlaying: held === null,
    /** 멈춰 세우거나 다시 풀거나 — 풀 때는 보던 자리에서 이어 가도록 어긋난 만큼을 오프셋으로 옮긴다 */
    toggle: () => {
      if (held === null) held = running;
      else {
        offset += held - wrap(slotNow() + offset);
        held = null;
      }

      bump();
    },
    /** 앞뒤로 한 칸 */
    step: (delta: number) => {
      if (held === null) offset += delta;
      else held = wrap(held + delta);

      bump();
    },
    /** 그 자리로 바로 */
    goTo: (next: number) => {
      if (held === null) offset += next - running;
      else held = wrap(next);

      bump();
    },
  };
}
