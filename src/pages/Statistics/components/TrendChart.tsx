import { EChart } from '@/components/common/EChart';
import { describePeriod, getTrend, labelOf, pickEnergyUnit } from '@/mocks/generation';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { PeriodKey } from '@/mocks/generation';
import type { EChartsOption } from 'echarts';

interface TrendChartProps {
  period: PeriodKey;
  /** 기준일. 이 날짜가 속한 구간을 그리고 해당 막대를 강조한다. */
  date: Date;
  /** 선택 발전소 몫으로 환산할 계수. 전체를 볼 때는 1. */
  factor?: number;
  /** 차트 요약 문장에 넣을 대상 이름 */
  scopeLabel: string;
  height?: number;
}

/** 발전량(막대)과 일사량(선)을 한 좌표계에 겹쳐 그린다. */
export function TrendChart({ period, date, factor = 1, scopeLabel, height = 340 }: TrendChartProps) {
  const palette = useChartPalette();
  const points = getTrend(period, date);
  const scaled = points.map((point) => ({ ...point, generation: point.generation * factor }));
  const { divider, unit } = pickEnergyUnit(Math.max(...scaled.map((point) => point.generation)));
  const focusLabel = labelOf(period, date);

  const option: EChartsOption = {
    grid: { top: LEGEND_GRID_TOP, right: 52, bottom: 32, left: 56 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
      axisPointer: { type: 'shadow', shadowStyle: { color: palette.generationSoft } },
    },
    legend: topLegend(palette, ['발전량', '일사량']),
    xAxis: {
      type: 'category',
      data: points.map((point) => point.label),
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
    },
    yAxis: [
      {
        type: 'value',
        name: unit,
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11, padding: [0, 0, 0, -28] },
        splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
        axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
      },
      {
        type: 'value',
        name: 'kWh/m²',
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11, padding: [0, -34, 0, 0] },
        splitLine: { show: false },
        axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
      },
    ],
    series: [
      {
        name: '발전량',
        type: 'bar',
        barMaxWidth: 26,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        data: scaled.map((point) => ({
          value: Number((point.generation / divider).toFixed(2)),
          // 기준일에 해당하는 막대만 진한 색으로 짚어 준다.
          itemStyle: { color: point.label === focusLabel ? palette.generationFocus : palette.generation },
        })),
        animationDuration: 800,
        animationDelay: (index: number) => index * 28,
      },
      {
        name: '일사량',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: palette.irradiance, width: 2 },
        itemStyle: { color: palette.irradiance },
        data: points.map((point) => Number(point.irradiance.toFixed(2))),
        animationDuration: 900,
        animationDelay: 320,
      },
    ],
  };

  const total = scaled.reduce((sum, point) => sum + point.generation, 0);
  const best = scaled.reduce((top, point) => (point.generation > top.generation ? point : top), scaled[0]);
  const summary = `${scopeLabel}의 ${describePeriod(period, date)} 발전량 추이. 합계 ${formatNumber(total / divider, 1)}${unit}, 최고 ${best.label}.`;

  return <EChart option={option} height={height} summary={summary} />;
}
