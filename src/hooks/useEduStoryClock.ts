import { useEffect, useRef, useState } from 'react';

/** 이야기 한 장(章). 장마다 걸음 수도 머무는 시간도 다르다 */
export interface StoryChapter {
  id: string;
  steps: number;
  /** 걸음 하나가 머무는 시간(ms) */
  stepMs: number;
}

interface StoryClock {
  /** 지금 몇 번째 장인지 */
  chapter: number;
  /** 그 장 안에서 몇 번째 걸음인지 */
  step: number;
  /** 지금 걸음 안에서 얼마나 왔는지 (0~1). 다음으로 넘어가기까지 얼마나 남았는지가 이 값이다 */
  stepProgress: number;
  /** 넘김을 멈춰 두었는지 */
  paused: boolean;
  togglePause: () => void;
  /** 손으로 장을 골랐을 때 */
  goTo: (chapter: number) => void;
}

/** 값을 다시 읽는 간격 */
const TICK_MS = 250;

/**
 * 지금 시각.
 * 훅 밖에 두어 "그리는 동안에는 부르지 않는다" 를 분명히 한다 — 그려지는 중에 시각을 읽으면
 * 같은 입력에도 결과가 달라져 화면이 예측할 수 없게 흔들린다.
 */
function now(): number {
  return Date.now();
}

/**
 * 세 장짜리 이야기를 스스로 넘기는 시계 (SFR-005-07/08).
 *
 * 장마다 걸음 수와 머무는 시간이 달라(발전 순서는 다섯 걸음, 환경 효과는 한 화면, 좋은 점은 네 걸음)
 * 쪽 넘김 장치 하나로는 다룰 수 없다. 그래서 전체를 하나의 타임라인으로 펴 두고, 흐른 시간이
 * 어느 장 어느 걸음에 떨어지는지를 그때그때 계산한다.
 *
 * 틱마다 값을 더해 쌓지 않고 **시작한 뒤 흐른 시간으로 계산**하는 것이 핵심이다. 브라우저는 화면이
 * 가려진 탭의 타이머를 늦추는데, 쌓아 올리는 방식이면 그동안 이야기가 밀린 채로 남는다.
 */
export function useEduStoryClock(chapters: StoryChapter[]): StoryClock {
  // 장이 시작하는 지점을 미리 재 둔다 — 흐른 시간을 여기에 견주면 지금 어디인지 바로 나온다.
  const spans = chapters.map((item) => item.steps * item.stepMs);
  const total = spans.reduce((sum, span) => sum + span, 0);
  const offsets = spans.reduce<number[]>((acc, span, index) => [...acc, (acc[index] ?? 0) + span], [0]);

  const startedAt = useRef(0);
  /** 멈춘 자리. 다시 틀 때 시작 시각을 이만큼 뒤로 당겨 이어서 흐르게 한다 */
  const stoppedAt = useRef(0);
  const [position, setPosition] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (total <= 0 || paused) return undefined;

    // 시각을 읽는 일은 그릴 때가 아니라 붙은 뒤에 한다 — 그려지는 동안은 값이 늘 같아야 한다.
    if (startedAt.current === 0) startedAt.current = now();

    const read = () => setPosition((now() - startedAt.current) % total);

    read();

    const timer = window.setInterval(read, TICK_MS);

    // 화면이 다시 보이는 순간에는 틱을 기다리지 않고 곧바로 맞춘다.
    document.addEventListener('visibilitychange', read);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', read);
    };
  }, [total, paused]);

  // 손으로 고른 장으로 건너뛴다. 시작 시각을 뒤로 당겨 두면 그 장의 첫 걸음부터 시간이 다시 흐른다.
  const goTo = (index: number) => {
    const at = offsets[index] ?? 0;

    startedAt.current = now() - at;
    stoppedAt.current = at;
    setPosition(at);
  };

  /*
    넘김을 멈추고 다시 튼다.

    멈추는 것은 **이야기가 다음으로 넘어가는 일**이지 그림이 아니다 — 해는 계속 빛나고 바람도 계속 분다.
    보고 있는 아이가 한 걸음을 더 오래 들여다보게 하는 장치라, 그림까지 얼리면 오히려 화면이 죽는다.
  */
  const togglePause = () => {
    if (paused) startedAt.current = now() - stoppedAt.current;
    else stoppedAt.current = position;

    setPaused(!paused);
  };

  const chapter = Math.max(0, spans.findIndex((span, index) => position < offsets[index] + span));
  const into = position - (offsets[chapter] ?? 0);

  const stepMs = chapters[chapter].stepMs;
  const step = Math.min(chapters[chapter].steps - 1, Math.floor(into / stepMs));

  return {
    chapter,
    step,
    stepProgress: Math.min(1, Math.max(0, (into - step * stepMs) / stepMs)),
    paused,
    togglePause,
    goTo,
  };
}
