import { useLayoutEffect } from 'react';

/**
 * 화면이 떠 있는 동안에만 `<html>` 에 클래스를 붙인다.
 *
 * 글자 크기 기준(`rem`)처럼 문서 뿌리에서만 정할 수 있는 것을 화면 하나에만 다르게 주려고 둔다.
 * 컴포넌트가 사라지면 클래스도 함께 떨어지므로, 다른 화면으로 넘어가면 원래 기준으로 돌아온다.
 *
 * `useLayoutEffect` 인 것은 순서 때문이다. 리액트는 자식의 `useEffect` 를 부모보다 먼저 돌리는데,
 * 칸 높이를 재어 그림에 넘기는 컴포넌트(차트)가 그때 재면 **글씨가 커지기 전의 높이**를 집는다.
 * 그 값이 그대로 굳어 그림이 제 칸보다 크게 그려지고, 아래 글 위에 겹쳐 앉는다 —
 * 실제로 그렇게 됐다 (2026-08-31). 부모의 `useLayoutEffect` 는 자식의 `useEffect` 보다 앞서므로,
 * 자식이 재는 시점에는 이미 키운 글씨로 배치가 잡혀 있다.
 */
export function useRootClass(className: string) {
  useLayoutEffect(() => {
    const root = document.documentElement;

    root.classList.add(className);

    return () => root.classList.remove(className);
  }, [className]);
}
