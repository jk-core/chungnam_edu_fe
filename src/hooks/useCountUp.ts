import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

interface Options {
  duration?: number;
  /** false 면 애니메이션 없이 최종값을 유지한다. */
  enabled?: boolean;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * 목표값까지 부드럽게 증가하는 수치를 돌려준다.
 * 감소 모션 설정이 켜져 있으면 즉시 최종값을 반환한다.
 */
export function useCountUp(target: number, { duration = 1200, enabled = true }: Options = {}): number {
  const reduceMotion = useReducedMotion();
  // 백그라운드 탭에서는 rAF 가 돌지 않아 0 에 멈춘다. 숨은 상태로 열렸다면 애니메이션을 건너뛴다.
  const [openedHidden] = useState(() => document.visibilityState === 'hidden');
  const shouldAnimate = enabled && !reduceMotion && !openedHidden;
  const [animated, setAnimated] = useState(0);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!shouldAnimate) return;

    const start = performance.now();

    const tick = (now: number) => {
      /*
        진행도는 아래로도 잠근다.

        위만 잠갔더니 `now` 가 `start` 보다 이른 프레임에서 진행도가 음수가 되고, easeOutCubic 은
        음수를 받으면 −0.33 처럼 크게 음수를 돌려준다(1 − (1−t)³). 그 값이 목표에 곱해져 화면에
        「−42 그루」 가 떴다. 시각을 재는 두 축(`performance.now()` 와 rAF 가 넘겨주는 시각)이
        늘 같은 원점을 쓴다는 보장이 없어 실제로 벌어지는 일이다.
      */
      const progress = Math.min(Math.max((now - start) / duration, 0), 1);

      setAnimated(target * easeOutCubic(progress));

      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, shouldAnimate]);

  return shouldAnimate ? animated : target;
}
