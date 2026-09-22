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

  const option: EChartsOption = {
    animation: animate,
    grid: { top: 4, right: 4, bottom: 4, left: 4 },
    xAxis: { type: 'category', show: false, boundaryGap: false, data: values.map((_, index) => index) },
    /*
      기준이 있으면 0~100 을 통째로 본다 — 값 범위에 맞춰 늘이면 90~100 사이를 오가는 설비가
      기준선을 한참 밑에 두고도 바닥을 치는 것처럼 보인다.
    */
    yAxis: bands
      ? { type: 'value', show: false, min: 0, max: Math.max(100, ...values) }
      : { type: 'value', show: false, min: 'dataMin', max: 'dataMax' },
    series: bands
      ? BAND_ORDER.map((band, index) => line(
        bandValues(values, band, bandOf),
        bandColor[band],
        index === 0 ? head : undefined,
      ))
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
 * 한 밴드가 맡는 구간만 남기고 나머지는 끊는다.
 * 경계를 지나는 선분은 양쪽 밴드가 함께 그려, 색이 바뀌는 자리에서 선이 비지 않게 한다.
 */
function bandValues(values: number[], band: Band, bandOf: (value: number) => Band): (number | null)[] {
  const own: (number | null)[] = values.map((value) => (bandOf(value) === band ? value : null));

  values.forEach((value, index) => {
    if (index === 0) return;

    const previous = bandOf(values[index - 1]);
    const current = bandOf(value);

    if (previous === current) return;
    if (current === band) own[index - 1] = values[index - 1];
    if (previous === band) own[index] = value;
  });

  return own;
}
