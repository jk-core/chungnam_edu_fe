import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

interface AutoPagerOptions {
  /** 전체 항목 수 */
  total: number;
  /** 한 쪽이 머무는 시간(ms) */
  intervalMs?: number;
  /**
   * 한 쪽에 담을 개수를 못 박는다.
   * 주지 않으면 칸 높이를 재서 들어가는 만큼 담는다.
   */
  perPage?: number;
}

interface AutoPager<TFrame extends HTMLElement, TItem extends HTMLElement> {
  /** 항목이 담기는 칸 — 이 높이로 한 쪽에 몇 개가 들어가는지 잰다 */
  frameRef: React.RefObject<TFrame | null>;
  /** 첫 항목 — 항목 하나의 높이를 재는 자 */
  itemRef: React.RefObject<TItem | null>;
  /** 지금 쪽에서 보여 줄 구간 */
  from: number;
  to: number;
  /** 한 쪽에 담기는 개수 */
  perPage: number;
  page: number;
  pageCount: number;
  /** 쪽이 넘어갈 때마다 바뀌는 값 — 진행 막대를 되감는 열쇠 */
  turnKey: number;
  /** 자동 넘김을 멈춰 두었는지 */
  paused: boolean;
  togglePause: () => void;
  goTo: (page: number) => void;
  next: () => void;
  prev: () => void;
}

/**
 * 넘치는 목록을 스크롤 대신 쪽으로 나눠 스스로 넘긴다 (SFR-004).
 *
 * 벽면 모니터에는 스크롤바를 굴려 줄 사람이 없다. 칸에 들어가는 만큼만 보여 주고
 * 나머지는 시간이 지나면 저절로 나타나야, 지나가며 보는 사람도 전체를 볼 수 있다.
 *
 * 한 쪽에 몇 개가 들어가는지는 재서 정한다 — 화면 크기와 글자 크기에 따라 달라지므로
 * 숫자를 박아 두면 어느 모니터에서는 잘리고 어느 모니터에서는 빈자리가 남는다.
 * 다만 칸을 나눠 쓰는 방식이 정해져 있는 화면은 `perPage` 로 직접 못 박는다.
 */
export function useAutoPager<
  TFrame extends HTMLElement = HTMLElement,
  TItem extends HTMLElement = HTMLElement,
>({
  total,
  intervalMs = 6000,
  perPage: fixedPerPage,
}: AutoPagerOptions): AutoPager<TFrame, TItem> {
  const frameRef = useRef<TFrame>(null);
  const itemRef = useRef<TItem>(null);
  const [measured, setMeasured] = useState(total || 1);
  const [page, setPage] = useState(0);
  const [turnKey, setTurnKey] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;

    // 개수를 못 박아 두었으면 잴 것이 없다.
    if (!frame || fixedPerPage) return;

    // ResizeObserver 가 넘겨주는 contentRect 는 첫 콜백에서 낡은 값이라 노드를 직접 읽는다.
    const measure = () => {
      const item = itemRef.current;

      if (!item) return;

      const frameRect = frame.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      // 프레임 높이가 아니라 "첫 항목이 시작하는 곳부터 프레임 끝까지" 를 잰다 —
      // 표 머리글처럼 항목 위에 붙는 것이 있어도 남는 자리를 정확히 알 수 있다.
      const available = frameRect.bottom - itemRect.top;

      if (available <= 0 || itemRect.height <= 0 || itemRect.width <= 0) return;

      const style = getComputedStyle(frame);
      const rowGap = Number.parseFloat(style.rowGap) || 0;
      const columnGap = Number.parseFloat(style.columnGap) || 0;

      // 한 줄에 여럿이 놓이는 격자도 있다. 세로만 재면 카드 판이 절반도 못 채운다.
      // 표처럼 항목이 폭을 다 쓰면 열은 저절로 1이 된다.
      const rows = Math.floor((available + rowGap) / (itemRect.height + rowGap));
      const columns = Math.floor((frameRect.width + columnGap) / (itemRect.width + columnGap));

      setMeasured(Math.max(1, rows) * Math.max(1, columns));
    };

    measure();

    /*
      칸만 지켜보면 모자란다.

      항목 하나의 높이는 글꼴이 붙고 줄이 접히면서 첫 측정 뒤에 바뀐다 — 재던 순간 41px 이던
      줄이 42px 로 굳으면 계산이 한 줄을 더 넣고, 그 한 줄이 칸 밖으로 밀려 잘린다.
      항목도 함께 지켜보면 높이가 굳는 순간 다시 잰다.
    */
    const observer = new ResizeObserver(measure);

    observer.observe(frame);

    if (itemRef.current) observer.observe(itemRef.current);

    return () => observer.disconnect();
  }, [total, fixedPerPage]);

  const perPage = Math.max(1, fixedPerPage ?? measured);

  /*
    재고 나서 한 번 더 확인한다.

    개수는 첫 항목 높이를 자로 삼아 내는데, 줄마다 높이가 같지 않다 — 이름이 길어 접히는 줄이
    하나 섞이면 그 한 줄이 칸 밖으로 밀려 잘린다. 자를 아무리 정확히 대도 서로 다른 줄을 하나로
    재는 한 어긋날 수 있으므로, 그린 뒤에 넘쳤는지 보고 넘쳤으면 한 줄을 뺀다.

    줄이 빠지면 내용이 줄어 넘침이 사라지므로 한두 번에 멎는다. 한 줄이 칸보다 커도 1 에서
    멈춘다 — 그때는 줄이는 것으로 풀 수 없는 문제다.
  */
  useLayoutEffect(() => {
    const frame = frameRef.current;

    if (!frame || fixedPerPage || perPage <= 1) return;
    if (frame.scrollHeight - frame.clientHeight <= 1) return;

    setMeasured(perPage - 1);
  }, [fixedPerPage, perPage, page, total]);
  const pageCount = Math.max(1, Math.ceil(total / perPage));

  // 목록이 줄어 지금 쪽이 사라졌을 수 있다.
  const safePage = Math.min(page, pageCount - 1);

  const goTo = useCallback((next: number) => {
    setPage(next);
    // 진행 막대를 되감아, 손으로 넘긴 쪽도 머무는 시간을 온전히 갖게 한다.
    setTurnKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // 한 쪽에 다 담기면 넘길 것이 없다. 멈춰 두었을 때도 마찬가지다.
    if (pageCount <= 1 || paused) return;

    // turnKey 를 의존성에 두어, 손으로 넘긴 직후에는 시간이 처음부터 다시 흐르게 한다.
    const timer = window.setTimeout(() => {
      goTo((safePage + 1) % pageCount);
    }, intervalMs);

    return () => window.clearTimeout(timer);
  }, [pageCount, intervalMs, paused, safePage, turnKey, goTo]);

  const from = safePage * perPage;

  return {
    frameRef,
    itemRef,
    from,
    to: Math.min(total, from + perPage),
    perPage,
    page: safePage,
    pageCount,
    turnKey,
    paused,
    togglePause: useCallback(() => setPaused((prev) => !prev), []),
    goTo,
    next: useCallback(() => goTo((safePage + 1) % pageCount), [goTo, safePage, pageCount]),
    prev: useCallback(() => goTo((safePage - 1 + pageCount) % pageCount), [goTo, safePage, pageCount]),
  };
}
