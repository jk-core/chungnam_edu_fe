import { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { EChart } from '@/components/common/EChart';
import { integrationTrend } from '@/mocks/integrationLog';
import { Reveal } from '@/components/common/Reveal';
import { formatNumber, formatPercent } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import { useIntegrationLogs } from '../hooks/useIntegrationLogs';
import type { EChartsOption } from 'echarts';

/**
 * 일자별 전송 성공률 (SFR-027).
 *
 * 세로 눈금을 90~100% 로 좁힌다. 0 부터 그리면 하루치 실패가 막대 높이에서 보이지 않아,
 * 「어느 날부터 늘었나」 를 묻는 그림이 아무 말도 하지 않게 된다.
 */
export function IntegrationTrendChart() {
  const palette = useChartPalette();
  const logs = useIntegrationLogs();
  const trend = useMemo(() => integrationTrend(logs), [logs]);
  const averageRate = trend.reduce((sum, point) => sum + point.rate, 0) / Math.max(1, trend.length);

  const option: EChartsOption = {
    grid: { top: 20, right: 16, bottom: 28, left: 44 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12 },
      valueFormatter: (value) => `${formatNumber(Number(value), 1)}%`,
    },
    xAxis: {
      type: 'category',
      data: trend.map((point) => point.date.slice(5)),
      axisLabel: { color: palette.textMuted, fontSize: 11, interval: 3 },
      axisLine: { lineStyle: { color: palette.axis } },
    },
    yAxis: {
      type: 'value',
      max: 100,
      min: 90,
      axisLabel: { color: palette.textMuted, formatter: '{value}%', fontSize: 11 },
      splitLine: { lineStyle: { color: palette.grid } },
    },
    series: [
      {
        name: '성공률',
        type: 'bar',
        barWidth: 10,
        // 하루라도 실패가 있으면 그날만 붉게 — 100% 가 아닌 날을 눈으로 찾게 한다
        data: trend.map((point) => ({
          value: Math.round(point.rate * 1000) / 10,
          itemStyle: { color: point.rate < 1 ? palette.critical : palette.series1 },
        })),
      },
    ],
  };

  return (
    <Reveal delay={0.05}>
      <Card
        title="일자별 전송 성공률"
        description="어느 날부터 실패가 늘었는지 추이로 봅니다. 100%에 못 미친 날은 붉게 표시했습니다."
      >
        <EChart
          option={option}
          height={240}
          summary={`최근 30일 전송 성공률 추이. 평균 ${formatPercent(averageRate, 1)}.`}
        />
      </Card>
    </Reveal>
  );
}
