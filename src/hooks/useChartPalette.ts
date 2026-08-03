import { useEffect, useState } from 'react';
import { useTheme } from '@/stores/themeStore';

const VARIABLES = {
  grid: '--chart-grid',
  axis: '--chart-axis',
  generation: '--chart-generation',
  generationSoft: '--chart-generation-soft',
  generationFocus: '--chart-generation-focus',
  irradiance: '--chart-irradiance',
  compare: '--chart-compare',
  text: '--text',
  textMuted: '--text-muted',
  surface: '--surface',
  border: '--border',
  ok: '--ok',
  okSoft: '--ok-soft',
  caution: '--caution',
  critical: '--critical',
  criticalSoft: '--critical-soft',
  series1: '--series-1',
  series2: '--series-2',
  series3: '--series-3',
  series4: '--series-4',
  series5: '--series-5',
  series6: '--series-6',
  series7: '--series-7',
  series8: '--series-8',
} as const;

export type ChartPalette = Record<keyof typeof VARIABLES, string>;

/**
 * 차트는 CSS 변수를 직접 못 읽으므로, 현재 테마의 계산값을 읽어 옵션에 넘긴다.
 * 테마가 바뀌면 다시 읽어 차트를 갱신한다.
 */
export function useChartPalette(): ChartPalette {
  const theme = useTheme();
  const [palette, setPalette] = useState<ChartPalette>(() => readPalette());

  useEffect(() => {
    // 테마 전환 트랜지션이 끝난 뒤의 최종 색을 읽는다.
    const timer = window.setTimeout(() => setPalette(readPalette()), 60);

    return () => window.clearTimeout(timer);
  }, [theme]);

  return palette;
}

function readPalette(): ChartPalette {
  const computed = getComputedStyle(document.documentElement);
  const entries = Object.entries(VARIABLES).map(([key, variable]) => [
    key,
    computed.getPropertyValue(variable).trim(),
  ]);

  return Object.fromEntries(entries) as ChartPalette;
}
