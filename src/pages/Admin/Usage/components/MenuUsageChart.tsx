import { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { EChart } from '@/components/common/EChart';
import { Reveal } from '@/components/common/Reveal';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import { AXIS_FONT } from './usageChart';
import { readMenuUsage, TOP_COUNT } from './usageData';
import type { EChartsOption } from 'echarts';

/**
 * 메뉴별 조회수 상위 (SFR-028).
 *
 * 가로 막대로 세운다 — 화면 이름이 길어 세로 막대에 붙이면 글자가 기울어 눕는다.
 */
export function MenuUsageChart() {
  const palette = useChartPalette();
  const rows = useMemo(() => readMenuUsage().slice(0, TOP_COUNT), []);
  const top = rows[0];

  const option: EChartsOption = {
    grid: { top: 10, right: 30, bottom: 10, left: 110 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12 },
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: palette.textMuted, ...AXIS_FONT },
      splitLine: { lineStyle: { color: palette.grid } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((row) => row.menu),
      axisLabel: { color: palette.text, ...AXIS_FONT },
      axisLine: { lineStyle: { color: palette.axis } },
    },
    series: [
      {
        name: '조회수',
        type: 'bar',
        barWidth: 14,
        itemStyle: { borderRadius: [0, 4, 4, 0], color: palette.series1 },
        data: rows.map((row) => row.views),
      },
    ],
  };

  return (
    <Reveal delay={0.05}>
      <Card title={`메뉴별 조회수 상위 ${TOP_COUNT}개`} description="어떤 화면이 실제로 쓰이는지 봅니다.">
        <EChart
          option={option}
          height={320}
          summary={`메뉴별 조회수 상위 ${TOP_COUNT}개. 1위 ${top.menu} ${formatNumber(top.views)}회.`}
        />
      </Card>
    </Reveal>
  );
}
