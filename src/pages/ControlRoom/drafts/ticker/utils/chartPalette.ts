import { useEffect, useState } from 'react';
import { useTheme } from '@/stores/themeStore';
import type { RefObject } from 'react';

/**
 * 이 화면의 차트가 읽는 색.
 *
 * 공용 `useChartPalette` 는 색을 `document.documentElement` 에서 읽는다. 그런데 이 시안의 차트
 * 색(파란 발전 곡선 등)은 스킨이 `.room[data-skin="ticker"]` 안에서만 다시 매므로, 루트에서
 * 읽으면 서비스 기본색(주황 발전)을 집어 스킨과 어긋난다. 그래서 판 요소에서 직접 읽어
 * 스킨이 덮은 값을 그대로 가져온다. 테마(라이트/다크)는 루트에서 갈리므로 테마가 바뀌면
 * 다시 읽어 차트 색도 따라오게 한다.
 */
export interface TickerChartPalette {
  generation: string;
  generationSoft: string;
  grid: string;
  axis: string;
  surface: string;
  border: string;
  text: string;
}

const VARIABLES: Record<keyof TickerChartPalette, string> = {
  generation: '--chart-generation',
  generationSoft: '--chart-generation-soft',
  grid: '--chart-grid',
  axis: '--chart-axis',
  surface: '--surface',
  border: '--border',
  text: '--text',
};

function readPalette(element: Element | null): TickerChartPalette {
  const computed = getComputedStyle(element ?? document.documentElement);
  const entries = Object.entries(VARIABLES).map(([key, variable]) => [
    key,
    computed.getPropertyValue(variable).trim(),
  ]);

  return Object.fromEntries(entries) as TickerChartPalette;
}

export function useTickerChartPalette(ref: RefObject<Element | null>): TickerChartPalette {
  const theme = useTheme();

  // 첫 렌더에는 판 요소가 아직 없어 루트값(서비스 기본색)으로 시작하고, 마운트 직후 아래 효과가
  // 판 요소에서 스킨값을 다시 읽어 덮는다 — 렌더 중에는 ref.current 를 건드리지 않는다.
  const [palette, setPalette] = useState<TickerChartPalette>(() => readPalette(null));

  useEffect(() => {
    // 테마 전환 트랜지션이 끝난 뒤의 최종 색을 판 요소에서 읽는다. 마운트 직후에도 한 번 돈다.
    const timer = window.setTimeout(() => setPalette(readPalette(ref.current)), 60);

    return () => window.clearTimeout(timer);
  }, [theme, ref]);

  return palette;
}
