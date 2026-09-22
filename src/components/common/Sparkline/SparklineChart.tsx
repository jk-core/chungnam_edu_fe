import { LineChart } from 'echarts/charts';
import { GridComponent, MarkLineComponent, MarkPointComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import ReactEChartsCore from 'echarts-for-react/esm/core';
import { useChartPalette } from '@/hooks/useChartPalette';
import { useTheme } from '@/stores/themeStore';
import type { SparklineProps } from './types';
import type { EChartsOption, LineSeriesOption } from 'echarts';

echarts.use([LineChart, GridComponent, MarkLineComponent, MarkPointComponent, CanvasRenderer]);

type Band = 'base' | 'warn' | 'critical';

/** 밴드를 그리는 순서 — 심각한 쪽이 나중에 그려져 위에 온다 */
const BAND_ORDER: Band[] = ['base', 'warn', 'critical'];

/** 경계를 넘는 선분을 누가 가져갈지 가른다 */
const SEVERITY: Record<Band, number> = { base: 0, warn: 1, critical: 2 };

/** 추세선 본체. echarts 를 여기서만 들여 초기 화면이 그 무게를 지지 않게 한다. */
export default function SparklineChart({
  values,
  tone = 'brand',
  bands,
  animate = true,
  filled = false,
}: SparklineProps) {
  const palette = useChartPalette();
  const theme = useTheme();

  const base = palette[tone];
  const bandColor: Record<Band, string> = { base, warn: palette.caution, critical: palette.critical };
  const bandOf = (value: number): Band => {
    if (!bands) return 'base';
    if (value < bands.critical) return 'critical';
    if (value < bands.warn) return 'warn';

    return 'base';
  };

  const line = (data: (number | null)[], color: string, extra?: LineSeriesOption): LineSeriesOption => ({
    type: 'line',
    data,
    silent: true,
    showSymbol: false,
    connectNulls: false,
    lineStyle: { color, width: 1.8 },
    itemStyle: { color },
    ...(filled ? { areaStyle: { color, opacity: 0.14 } } : {}),
    ...extra,
  });

  const lastValue = values[values.length - 1];
  const head: LineSeriesOption = {
    // 끝점이 안 잰 날이면 찍을 자리가 없다.
    ...(lastValue !== null ? {
      markPoint: {
        silent: true,
        symbolSize: 6,
        label: { show: false },
        data: [{
          name: 'last',
          coord: [values.length - 1, lastValue],
          itemStyle: { color: bandColor[bandOf(lastValue)] },
        }],
      },
    } : {}),
    // 기준이 있을 때만 그 선을 깐다 — 어디부터 주의인지 눈이 먼저 잡는다.
    ...(bands ? {
      markLine: {
        silent: true,
        symbol: 'none',
        label: { show: false },
        lineStyle: { color: palette.caution, type: 'dashed', width: 1, opacity: 0.55 },
        data: [{ yAxis: bands.warn }],
      },
    } : {}),
  };

  /*
    마커는 점이 실제로 있는 계열에 붙인다 — 줄곧 경고인 설비는 정상 계열이 통째로 비어,
    거기 붙이면 그 설비에서만 끝점과 기준선이 사라진다.
  */
  const bandSeries = bands ? BAND_ORDER.map((band) => bandValues(values, band, bandOf)) : [];
  const headIndex = bandSeries.findIndex((data) => data.some((value) => value !== null));

  const option: EChartsOption = {
    animation: animate,
    grid: { top: 4, right: 4, bottom: 4, left: 4 },
    xAxis: { type: 'category', show: false, boundaryGap: false, data: values.map((_, index) => index) },
    /*
      기준이 있으면 0~100 을 통째로 본다 — 값 범위에 맞춰 늘이면 90~100 사이를 오가는 설비가
      기준선을 한참 밑에 두고도 바닥을 치는 것처럼 보인다.
    */
    yAxis: bands
      ? { type: 'value', show: false, min: 0, max: Math.max(100, ...values.filter((value) => value !== null)) }
      : { type: 'value', show: false, min: 'dataMin', max: 'dataMax' },
    series: bands
      ? BAND_ORDER.map((band, index) => line(bandSeries[index], bandColor[band], index === headIndex ? head : undefined))
      : [line(values, base, head)],
  };

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge
      // 테마가 바뀌면 색을 새로 계산해야 하므로 인스턴스를 다시 만든다.
      key={theme}
    />
  );
}

/**
 * 한 밴드가 맡는 선분의 양 끝점만 남기고 나머지는 끊는다.
 *
 * 경계를 넘는 선분은 **심각한 쪽이 통째로** 가져간다 — 양쪽이 나눠 그리면 같은 자리에 두 색이
 * 겹쳐 앉고, 밴드를 자주 오가는 값에서는 그 겹침이 이어 붙어 구간을 통째로 덮는다.
 */
function bandValues(values: (number | null)[], band: Band, bandOf: (value: number) => Band): (number | null)[] {
  const own: (number | null)[] = values.map(() => null);

  for (let index = 1; index < values.length; index += 1) {
    const previous = values[index - 1];
    const current = values[index];

    // 안 잰 날은 선을 잇지 않는다 — 이으면 없는 값이 추세로 읽힌다.
    if (previous === null || current === null) continue;

    const owner = SEVERITY[bandOf(previous)] >= SEVERITY[bandOf(current)] ? bandOf(previous) : bandOf(current);

    if (owner !== band) continue;
    own[index - 1] = previous;
    own[index] = current;
  }

  return own;
}
