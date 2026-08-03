import { EChart } from '@/components/common/EChart';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { NOW_HOUR } from '@/mocks/today';
import { formatNumber } from '@/utils/format';
import { getHourlyTrend } from '@/mocks/generation';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { School } from '@/interface/energy';
import styles from './LiveTrendChart.module.scss';
import type { EChartsOption } from 'echarts';

const AXIS_FONT = { fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' };

interface LiveTrendChartProps {
  /** 필터로 좁힌 발전소 — 권역 집계에 쓴다 */
  schools: School[];
  date: Date;
  height: number;
}

/**
 * 시간대별 출력 곡선 + 권역별 집계 (SFR-004-01/03/06).
 * 지금 시각에 세로 기준선을 그어 "어디까지 왔는지"를 바로 읽히게 한다.
 */
export function LiveTrendChart({ schools, date, height }: LiveTrendChartProps) {
  const palette = useChartPalette();
  const hourly = getHourlyTrend(date);
  const nowIndex = Math.min(hourly.length - 1, Math.round(NOW_HOUR));

  // 필터에 걸린 학교들을 시·군으로 묶어 오늘 발전량을 합친다.
  const byRegion = new Map<string, number>();

  schools.forEach((school) => {
    byRegion.set(school.regionName, (byRegion.get(school.regionName) ?? 0) + school.todayKwh);
  });

  const regions = [...byRegion.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const option: EChartsOption = {
    grid: { top: LEGEND_GRID_TOP, right: 24, bottom: 28, left: 56 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
    },
    legend: topLegend(palette, ['시간대별 발전량']),
    xAxis: {
      type: 'category',
      data: hourly.map((point) => point.label),
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, ...AXIS_FONT },
    },
    yAxis: {
      type: 'value',
      name: 'kWh',
      nameGap: AXIS_NAME_GAP,
      nameTextStyle: { color: palette.axis, fontSize: 11 },
      splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
      axisLabel: { color: palette.axis, ...AXIS_FONT },
    },
    series: [
      {
        name: '시간대별 발전량',
        type: 'bar',
        barMaxWidth: 18,
        itemStyle: { color: palette.generation, borderRadius: [4, 4, 0, 0] },
        // 지금 시각 막대만 밝게 칠해 어디까지 왔는지 보이게 한다.
        data: hourly.map((point, index) => ({
          value: point.generation,
          itemStyle: index === nowIndex ? { color: palette.generationFocus } : undefined,
        })),
      },
    ],
  };

  return (
    <div className={styles.chart}>
      <EChart
        option={option}
        height={height}
        summary={`시간대별 발전량 추이. 권역 상위 ${regions.length}곳 집계 포함.`}
      />

      <ul className={styles.regions} aria-label="권역별 금일 발전량">
        {regions.map(([name, kwh]) => (
          <li key={name} className={styles.regions__item}>
            <span className={styles.regions__name}>{name}</span>
            <span className={styles.regions__value}>{formatNumber(kwh)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
