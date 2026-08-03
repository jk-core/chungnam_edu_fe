import dayjs from 'dayjs';
import { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { EChart } from '@/components/common/EChart';
import { averagePerformance, getPerformanceSeries } from '@/mocks/equipment';
import { getPlantHealth, HEALTH } from '@/mocks/diagnosis';
import { Reveal } from '@/components/common/Reveal';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { formatNumber, formatPercent } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import { useDiagnosisRange } from '@/stores/filterStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import styles from '../AiDiagnosis.module.scss';
import { AnalysisBanner } from './AnalysisBanner';
import { AnalysisFilter } from './AnalysisFilter';
import { HealthGauge } from './HealthGauge';
import { PerformancePane } from './PerformancePane';
import type { EChartsOption } from 'echarts';

export function SummaryTab() {
  const { plant, plantLabel: label } = usePlantScope();
  const [range] = useDiagnosisRange();
  const palette = useChartPalette();

  const { points, previous } = useMemo(() => {
    const days = dayjs(range.end).diff(dayjs(range.start), 'day') + 1;
    const previousStart = dayjs(range.start).subtract(days, 'day').toDate();
    const previousEnd = dayjs(range.start).subtract(1, 'day').toDate();

    return {
      points: getPerformanceSeries(plant?.id ?? null, range.start, range.end),
      previous: averagePerformance(getPerformanceSeries(plant?.id ?? null, previousStart, previousEnd)),
    };
  }, [plant?.id, range.start, range.end]);

  const report = plant ? getPlantHealth(plant) : HEALTH;
  const summary = averagePerformance(points);
  const achievement = summary.expectedKwh > 0 ? summary.actualKwh / summary.expectedKwh : 0;

  const option: EChartsOption = {
    grid: { top: LEGEND_GRID_TOP, right: 24, bottom: 30, left: 56 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
    },
    legend: topLegend(palette, ['실측 발전량', '기대 발전량', 'PR']),
    xAxis: {
      type: 'category',
      data: points.map((point) => dayjs(point.date).format('M/D')),
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
    },
    yAxis: [
      {
        type: 'value',
        name: 'kWh',
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11, padding: [0, 0, 0, -28] },
        splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
        axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
      },
      {
        type: 'value',
        name: 'PR %',
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11 },
        max: 100,
        splitLine: { show: false },
        axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
      },
    ],
    series: [
      {
        name: '실측 발전량',
        type: 'bar',
        barMaxWidth: 18,
        itemStyle: { color: palette.generation, borderRadius: [4, 4, 0, 0] },
        data: points.map((point) => point.actualKwh),
      },
      {
        name: '기대 발전량',
        type: 'line',
        symbol: 'none',
        lineStyle: { color: palette.compare, width: 1.6, type: 'dashed' },
        itemStyle: { color: palette.compare },
        data: points.map((point) => point.expectedKwh),
      },
      {
        name: 'PR',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: palette.irradiance, width: 2 },
        itemStyle: { color: palette.irradiance },
        data: points.map((point) => Math.round(point.pr * 1000) / 10),
      },
    ],
  };

  return (
    <div className={styles.tab}>
      <AnalysisFilter />

      <Reveal>
        <AnalysisBanner />
      </Reveal>

      <Reveal delay={0.04}>
        <Card
          eyebrow="Health"
          title="종합 진단"
          description={`${label} 기준. 기대 발전량 대비 ${formatPercent(achievement, 1)}를 달성했습니다.`}
        >
          <HealthGauge report={report} />
        </Card>
      </Reveal>

      <div className={styles.grid2}>
        <Reveal delay={0.06}>
          <PerformancePane
            title="발전성능비 (PR)"
            hint="기대 발전량 대비 실측 비율. 날씨보다 설비 상태를 잘 드러냅니다."
            metric="pr"
            points={points}
            previousAverage={previous.pr}
            threshold={0.8}
          />
        </Reveal>
        <Reveal delay={0.12}>
          <PerformancePane
            title="이용률 (CF)"
            hint="설비용량을 하루 내내 썼다고 가정했을 때의 비율입니다."
            metric="cf"
            points={points}
            previousAverage={previous.cf}
            threshold={0.13}
          />
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <Card
          eyebrow="Expected"
          title="기대 대비 실측"
          description={`막대는 실측 발전량, 점선은 일사량으로 계산한 기대 발전량입니다. 두 값이 벌어진 날이 ${formatNumber(
            points.filter((point) => point.pr < 0.8).length,
          )}일 있습니다.`}
        >
          <EChart
            option={option}
            height={320}
            summary={`${label}의 기간 내 실측 ${formatNumber(summary.actualKwh / 1000, 1)}MWh, 기대 ${formatNumber(
              summary.expectedKwh / 1000,
              1,
            )}MWh, 평균 PR ${formatPercent(summary.pr, 1)}.`}
          />
        </Card>
      </Reveal>
    </div>
  );
}
