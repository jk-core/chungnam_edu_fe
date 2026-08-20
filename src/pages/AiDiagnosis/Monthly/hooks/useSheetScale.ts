import { useEffect, useRef, useState } from 'react';

/** 지면 실제 너비(px). `Report.module.scss` 의 $page-width 와 같은 값이다. */
const PAGE_WIDTH = 1050;

/**
 * 지면은 A4 실제 크기라 화면보다 넓다. 창에 맞춰 통째로 줄여 보여 준다 —
 * 가로로 밀어 가며 읽는 보고서는 미리보기 구실을 못한다.
 */
export function useSheetScale() {
  const stageRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  // 줄인 만큼 실제 높이도 당겨야 아래에 빈 자리가 남지 않는다 — `transform` 은 자리를 줄이지 않는다.
  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    const sheet = sheetRef.current;

    if (!stage || !sheet) return;

    const apply = () => {
      // 창이 아니라 본문 폭을 잰다 — 좌측 조회 대상 패널이 자리를 차지한다.
      setScale(Math.min(1, stage.clientWidth / PAGE_WIDTH));
      setSheetHeight(sheet.scrollHeight);
    };

    apply();

    const observer = new ResizeObserver(apply);

    observer.observe(stage);
    observer.observe(sheet);

    return () => observer.disconnect();
  }, []);

  return { stageRef, sheetRef, scale, stageHeight: sheetHeight > 0 ? sheetHeight * scale : undefined };
}
