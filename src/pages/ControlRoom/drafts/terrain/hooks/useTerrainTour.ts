import { useEffect, useSyncExternalStore } from 'react';

/**
 * 시안 B 의 순회 시계 (고객 요청 2026-09-15).
 *
 * 시안 A 와 나눠 쓰던 `ControlRoom/utils/regionTour` 를 떠나 이 시안만의 시계를 세운다.
 * 새로 들어온 요구 셋이 모두 A 와는 다른 규칙이기 때문이다 — 주기 20초(A 는 16초), 사람이
 * 직접 고르면 자동 전환이 꺼짐, 손을 놓고 60초가 지나면 저절로 다시 돎. 공용 시계를 고치면
 * A 의 AI 진단·시·군 지도가 함께 끌려가므로, 고치는 대신 여기에 한 벌을 따로 둔다.
 *
 * 대신 **시안 B 안에서는 이 하나만** 돈다 — 지도·상세·집계가 같은 훅을 보므로 판마다 다른
 * 시·군이 비칠 일이 없다. 상태를 훅이 아니라 모듈이 쥐는 것도 그래서다.
 */
export const REGION_TOUR_MS = 20_000;

/**
 * 직접 고른 뒤 다시 저절로 돌기까지 기다리는 시간(ms) (고객 요청 2026-09-15).
 *
 * 벽에 걸어 두는 화면이라 누군가 한 곳을 들여다보다 그냥 자리를 뜬다. 그대로 두면 화면이
 * 남의 관심사에 멈춘 채 하루를 보내므로, 손길이 끊기면 스스로 순회로 돌아간다. 60초는 한
 * 시·군의 상세와 발전소 하나를 읽기에는 넉넉하고, 자리를 뜬 뒤 붙들려 있기에는 짧은 값이다.
 */
const RESUME_MS = 60_000;

/** 자리가 넘어갔는지·붙잡음이 풀릴 때가 됐는지 살피는 간격(ms) */
const CHECK_MS = 250;

/**
 * 순회가 지금 어떤 상태인지.
 *
 * `held`(직접 고름)와 `stopped`(사람이 멈춰 세움)를 굳이 가르는 것은 푸는 방식이 다르기
 * 때문이다 — 붙잡음은 60초 뒤 저절로 풀리지만, 「순회 멈춤」 으로 세운 것은 몇 분이 지나도
 * 세워 둔 채여야 한다. 멈춰 놓고 자리를 뜬 사람이 돌아왔을 때 화면이 또 돌고 있으면
 * 멈춤 손잡이는 없는 것과 같다.
 */
export type TourState = 'running' | 'held' | 'stopped';

const listeners = new Set<() => void>();
let ticker: number | undefined;

/** 순회가 도는 자리 수. 판마다 같은 목록에서 세므로 값이 하나다 */
let span = 0;

/** 손으로 민 칸 수 — 벽시계에서 몇 칸 어긋나 있는지 */
let offset = 0;

/** 사람이 「순회 멈춤」 으로 세운 자리. `null` 이면 세우지 않은 것 */
let stopped: number | null = null;

/** 직접 골라 잠시 붙잡아 둔 자리. `null` 이면 붙잡지 않은 것 */
let held: number | null = null;

/** 마지막 손길이 닿은 시각 — 이 시각으로부터 RESUME_MS 를 센다 */
let touchedAt = 0;

/** 지금 걸린 자리 */
let slot = slotNow();

/** 바뀔 때마다 오르는 수 — `useSyncExternalStore` 스냅샷은 원시값이어야 다시 그리기가 멎는다 */
let version = 0;

/** 1970년부터 몇 번째 자리인지 */
function slotNow() {
  return Math.floor(Date.now() / REGION_TOUR_MS);
}

/** 모듈이 아는 자리 수로 접는다 — 시계가 스스로 붙잡음을 풀 때 쓴다 */
function wrapBySpan(value: number) {
  return span > 0 ? ((value % span) + span) % span : 0;
}

/**
 * 붙잡거나 세워 둔 자리에서 **이어서** 돌게 한다.
 *
 * 붙잡은 동안에도 벽시계는 흘렀으므로 그냥 풀면 화면이 몇 칸을 건너뛴다. 어긋난 만큼을
 * 오프셋으로 옮겨 두면 보고 있던 시·군에서 한 칸 뒤가 다음 차례가 된다.
 */
function resumeFrom(index: number) {
  offset += index - wrapBySpan(slotNow() + offset);
}

function bump() {
  version += 1;
  listeners.forEach((notify) => notify());
}

function subscribeTour(onChange: () => void) {
  listeners.add(onChange);

  if (ticker === undefined) {
    ticker = window.setInterval(() => {
      /*
        붙잡음이 60초를 넘겼는지 먼저 본다. 여기서 풀어야 아래 자리 넘김이 곧바로 이어진다.
        「순회 멈춤」 으로 세운 것(stopped)은 시간이 지나도 풀지 않는다.
      */
      const expired = held !== null && stopped === null && Date.now() - touchedAt >= RESUME_MS;

      if (expired && held !== null) {
        resumeFrom(held);
        held = null;
      }

      const next = slotNow();
      const moved = next !== slot;

      if (moved) slot = next;

      // 멈춰 세웠거나 붙잡아 둔 동안에는 시계가 흘러도 화면이 그대로다 — 다시 그릴 까닭이 없다
      if (expired || (moved && stopped === null && held === null)) bump();
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
 * 순회 자리와 그것을 옮기는 손잡이들.
 *
 * `count` 는 판마다 받지만 두 판이 같은 목록에서 세므로 같은 값이다. 자리 수를 넘는 값이
 * 들어와도 접어서 쓴다 — 조회 조건이 좁혀져 목록이 줄어드는 순간에도 없는 자리를 가리키지 않는다.
 */
export function useTerrainTour(count: number) {
  useSyncExternalStore(subscribeTour, getVersion, getVersion);

  /*
    자리 수는 모듈도 알아야 한다 — 시계가 스스로 붙잡음을 풀 때(60초) 접을 칸 수가 필요하다.
    그 값을 렌더 도중에 넣으면 렌더가 순수하지 않으므로 효과로 미룬다. 대신 렌더에서 쓰는
    접기는 아래 `wrap` 이 인자로 받은 `count` 로 직접 하므로, 첫 렌더에도 어긋나지 않는다.
  */
  useEffect(() => {
    span = count;
  }, [count]);

  const wrap = (value: number) => (count > 0 ? ((value % count) + count) % count : 0);
  const running = wrap(slot + offset);
  const state: TourState = stopped !== null ? 'stopped' : held !== null ? 'held' : 'running';

  return {
    index: stopped ?? held ?? running,
    state,
    /**
     * 마지막 손길이 닿은 시각.
     *
     * 붙잡힌 동안 얼마나 남았는지를 손잡이가 테두리 게이지로 그린다 (고객 요청 2026-09-15).
     * 남은 시간을 셈해 내려 주지 않고 **시작 시각만** 주는 것은, 매초 다시 그리면 지도까지
     * 함께 다시 그려지기 때문이다 — 게이지는 CSS 로 60초를 한 번에 돌리고, 이 값이 바뀔 때만
     * 처음부터 다시 돈다.
     */
    touchedAt,
    /** 사람이 세우거나 다시 푼다 — 명시적인 뜻이므로 붙잡음도 함께 정리한다 */
    toggle: () => {
      if (stopped === null) {
        stopped = held ?? running;
        held = null;
      } else {
        resumeFrom(stopped);
        stopped = null;
      }

      touchedAt = Date.now();
      bump();
    },
    /**
     * 사람이 시·군을 직접 골랐다 — 자동 전환을 끄고 그 자리에 선다 (고객 요청 2026-09-15).
     *
     * 「순회 멈춤」 으로 세워 둔 상태라면 세운 자리만 옮긴다. 세워 둔 것을 고르기 하나로
     * 풀어 버리면, 멈춰 놓고 이곳저곳 짚어 보던 사람이 갑자기 돌아가는 화면을 만난다.
     */
    pick: (next: number) => {
      if (stopped !== null) stopped = wrap(next);
      else held = wrap(next);

      touchedAt = Date.now();
      bump();
    },
    /**
     * 자리를 옮기지는 않는 손길(발전소 고르기·상세 닫기·전체 보기)을 적어 둔다.
     *
     * 60초는 마지막 손길에서부터 센다 — 시·군을 고른 뒤 그 안에서 발전소를 들여다보는
     * 동안에도 시계가 가면, 한창 읽는 중에 화면이 다음 시·군으로 넘어간다.
     */
    touch: () => {
      touchedAt = Date.now();

      // 아직 아무것도 붙잡지 않았다면 이 손길이 곧 붙잡음이다 — 돌던 자리를 그대로 세운다
      if (stopped === null && held === null) {
        held = running;
        bump();
      }
    },
  };
}
