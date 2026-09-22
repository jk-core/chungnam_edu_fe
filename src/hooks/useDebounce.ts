import { useEffect, useMemo, useRef } from 'react';

/**
 * 잠시 기다렸다 부른다 — 검색 입력이 한 글자마다 조회를 내보내지 않게 한다.
 *
 * 부르는 쪽이 매 렌더 새 함수를 넘겨도 타이머가 끊기지 않도록 최신 함수를 ref 로 들고,
 * 반환하는 함수 자체는 한 번만 만든다.
 */
export function useDebounce<A extends unknown[]>(callback: (...args: A) => void, delay = 300) {
  const latest = useRef(callback);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    latest.current = callback;
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  return useMemo(
    () => (...args: A) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => latest.current(...args), delay);
    },
    [delay],
  );
}
