import { EChart } from '@/components/common/EChart';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { NOW_HOUR } from '@/mocks/today';
import { getHourlyTrend } from '@/mocks/generation';
import { useChartPalette } from '@/hooks/useChartPalette';
import styles from './LiveTrendChart.module.scss';
import type { EChartsOption } from 'echarts';

const AXIS_FONT = { fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' };

interface LiveTrendChartProps {
  date: Date;
}

/**
 * 시간대별 발전량과 일사량 (SFR-004-01/03/06).
 *
 * 옆에 권역 목록을 함께 두었더니 여덟 줄만 보여 주는 반쪽짜리 표가 차트 자리를 절반 가져갔다.
 * 시·군별 실적은 왼쪽 판이 열다섯 곳을 모두 맡으므로 여기서는 차트만 남긴다.
 *
 * 일사량을 같은 판에 겹친다. 발전량이 왜 오르내렸는지는 그 시각에 들어온 햇빛이 답하는데,
 * 따로 두면 두 그림을 눈으로 겹쳐 봐야 한다. 단위가 달라 축은 좌우로 나눈다.
 */
export function LiveTrendChart({ date }: LiveTrendChartProps) {
  const palette = useChartPalette();
  const hourly = getHourlyTrend(date);
  const nowIndex = Math.min(hourly.length - 1, Math.round(NOW_HOUR));

  const option: EChartsOption = {
    grid: { top: LEGEND_GRID_TOP, right: 24, bottom: 28, left: 56 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
    },
    legend: topLegend(palette, ['발전량', '일사량']),
    xAxis: {
      type: 'category',
      data: hourly.map((point) => point.label),
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, ...AXIS_FONT },
    },
    yAxis: [
      {
        type: 'value',
        name: 'kWh',
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11 },
        splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
        axisLabel: { color: palette.axis, ...AXIS_FONT },
      },
      {
        type: 'value',
        name: 'kWh/m²',
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11 },
        splitLine: { show: false },
        axisLabel: { color: palette.axis, ...AXIS_FONT },
      },
    ],
    series: [
      {
        name: '발전량',
        type: 'bar',
        barMaxWidth: 18,
        itemStyle: { color: palette.generation, borderRadius: [4, 4, 0, 0] },
        // 지금 시각 막대만 밝게 칠해 어디까지 왔는지 보이게 한다.
        data: hourly.map((point, index) => ({
          value: point.generation,
          itemStyle: index === nowIndex ? { color: palette.generationFocus } : undefined,
        })),
      },
      {
        name: '일사량',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: palette.irradiance, width: 2 },
        itemStyle: { color: palette.irradiance },
        data: hourly.map((point) => point.irradiance),
      },
    ],
  };

  return (
    <div className={styles.chart}>
      {/*
        칸 높이는 옆의 권역 표가 정한다. 차트에 픽셀 높이를 박아 두면 그만큼 아래가 비므로
        칸을 그대로 채우게 두고, 최소 높이만 지켜 준다.
      */}
      <EChart
        className={styles.chart__canvas}
        option={option}
        height="100%"
        summary="시간대별 발전량과 같은 시각의 일사량 추이."
      />
    </div>
  );
}
