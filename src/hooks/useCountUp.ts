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
      const progress = Math.min((now - start) / duration, 1);

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
