import { Card } from '@/components/common/Card';
import { EChart } from '@/components/common/EChart';
import { RESOURCE_CRITICAL, RESOURCE_WARNING } from '@/configs/serverHealth';
import { SERVERS } from '@/mocks/serverHealth';
import { Reveal } from '@/components/common/Reveal';
import { seriesPalette } from '@/utils/chart';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { EChartsOption } from 'echarts';

const AXIS_FONT = { fontSize: 11, fontFamily: 'Pretendard Variable, sans-serif' };

const HOURS = Array.from({ length: 24 }, (_, hour) => `${hour}시`);

/**
 * 서버별 24시간 CPU 추이 (ECR-002-20).
 *
 * 임계선을 함께 긋되 계열 하나에만 얹는다 — 계열마다 그으면 같은 자리에 같은 선이 여러 겹
 * 겹쳐 굵어지고, 범례에도 임계선이 서버 수만큼 늘어선다.
 */
export function CpuTrendChart() {
  const palette = useChartPalette();
  const colors = seriesPalette(palette);
  const worstCpu = Math.max(...SERVERS.map((server) => server.cpu));

  const option: EChartsOption = {
    grid: { top: 30, right: 16, bottom: 24, left: 40 },
    legend: { top: 0, textStyle: { color: palette.textMuted, fontSize: 11 } },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12 },
    },
    xAxis: {
      type: 'category',
      data: HOURS,
      axisLabel: { color: palette.textMuted, ...AXIS_FONT, interval: 2 },
      axisLine: { lineStyle: { color: palette.axis } },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { color: palette.textMuted, formatter: '{value}%', ...AXIS_FONT },
      splitLine: { lineStyle: { color: palette.grid } },
    },
    series: SERVERS.map((server, index) => ({
      name: server.name,
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 1.8, color: colors[index % colors.length] },
      itemStyle: { color: colors[index % colors.length] },
      data: server.cpuTrend,
      markLine: index === 0
        ? {
          silent: true,
          symbol: 'none',
          label: { color: palette.textMuted, fontSize: 10 },
          lineStyle: { color: palette.critical, type: 'dashed' },
          data: [
            { yAxis: RESOURCE_CRITICAL, name: '위험' },
            { yAxis: RESOURCE_WARNING, name: '주의', lineStyle: { color: palette.caution, type: 'dashed' } },
          ],
        }
        : undefined,
    })),
  };

  return (
    <Reveal delay={0.08}>
      <Card title="24시간 CPU 사용률" description="점선은 주의·위험 임계선입니다.">
        <EChart
          option={option}
          height={300}
          summary={`서버 ${SERVERS.length}대의 24시간 CPU 추이. 최고 ${formatNumber(worstCpu)}%.`}
        />
      </Card>
    </Reveal>
  );
}
