import { useEffect, useRef, useState } from 'react';

interface AutoPagerOptions {
  /** 전체 항목 수 */
  total: number;
  /** 한 쪽이 머무는 시간(ms) */
  intervalMs?: number;
}

interface AutoPager<TFrame extends HTMLElement, TItem extends HTMLElement> {
  /** 항목이 담기는 칸 — 이 높이로 한 쪽에 몇 개가 들어가는지 잰다 */
  frameRef: React.RefObject<TFrame | null>;
  /** 첫 항목 — 항목 하나의 높이를 재는 자 */
  itemRef: React.RefObject<TItem | null>;
  /** 지금 쪽에서 보여 줄 구간 */
  from: number;
  to: number;
  page: number;
  pageCount: number;
  /** 쪽이 넘어갈 때마다 바뀌는 값 — 진행 막대를 되감는 열쇠 */
  turnKey: number;
}

/**
 * 넘치는 목록을 스크롤 대신 쪽으로 나눠 스스로 넘긴다 (SFR-004).
 *
 * 벽면 모니터에는 스크롤바를 굴려 줄 사람이 없다. 칸에 들어가는 만큼만 보여 주고
 * 나머지는 시간이 지나면 저절로 나타나야, 지나가며 보는 사람도 전체를 볼 수 있다.
 *
 * 한 쪽에 몇 개가 들어가는지는 재서 정한다 — 화면 크기와 글자 크기에 따라 달라지므로
 * 숫자를 박아 두면 어느 모니터에서는 잘리고 어느 모니터에서는 빈자리가 남는다.
 */
export function useAutoPager<TFrame extends HTMLElement, TItem extends HTMLElement>({
  total,
  intervalMs = 6000,
}: AutoPagerOptions): AutoPager<TFrame, TItem> {
  const frameRef = useRef<TFrame>(null);
  const itemRef = useRef<TItem>(null);
  const [perPage, setPerPage] = useState(total || 1);
  const [page, setPage] = useState(0);
  const [turnKey, setTurnKey] = useState(0);

  useEffect(() => {
    const frame = frameRef.current;

    if (!frame) return;

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

      setPerPage(Math.max(1, rows) * Math.max(1, columns));
    };

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(frame);

    return () => observer.disconnect();
  }, [total]);

  const pageCount = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    // 한 쪽에 다 담기면 넘길 것이 없다. 남아 있는 page 값은 아래 safePage 가 걸러 준다.
    if (pageCount <= 1) return;

    const timer = window.setInterval(() => {
      setPage((prev) => (prev + 1) % pageCount);
      setTurnKey((prev) => prev + 1);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [pageCount, intervalMs]);

  // 목록이 줄어 지금 쪽이 사라졌을 수 있다.
  const safePage = Math.min(page, pageCount - 1);
  const from = safePage * perPage;

  return {
    frameRef,
    itemRef,
    from,
    to: Math.min(total, from + perPage),
    page: safePage,
    pageCount,
    turnKey,
  };
}
