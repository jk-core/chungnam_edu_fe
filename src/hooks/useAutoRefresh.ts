import { useEffect, useState } from 'react';

/**
 * 일정 시간마다 값을 하나 올린다 (SFR-005-09 자동 갱신, SFR-005-08 자동 순환).
 * setInterval 은 문서가 가려져도 돌기 때문에, rAF 를 쓸 수 없는 이 환경에서도 안전하다.
 */
export function useAutoRefresh(intervalMs: number, steps = 0): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((prev) => (steps > 0 ? (prev + 1) % steps : prev + 1));
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, steps]);

  return tick;
}
