import dayjs from 'dayjs';
import { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { EChart } from '@/components/common/EChart';
import { averagePerformance, getPerformanceSeries } from '@/mocks/equipment';
import { getPlantHealth, HEALTH } from '@/mocks/diagnosis';
import { Reveal } from '@/components/common/Reveal';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import { useDiagnosisRange } from '@/stores/filterStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import styles from '../AiDiagnosis.module.scss';
import { AnalysisBanner } from './AnalysisBanner';
import { AnalysisFilter } from './AnalysisFilter';
import { HealthGauge } from './HealthGauge';
import { PerformancePane } from './PerformancePane';
import type { EChartsOption } from 'echarts';

/** 이 아래로 떨어진 발전시간은 주의로 본다 (h) */
const LOW_HOURS = 3;

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
  const lowDays = points.filter((point) => point.hours < LOW_HOURS).length;

  const option: EChartsOption = {
    grid: { top: LEGEND_GRID_TOP, right: 24, bottom: 30, left: 56 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
    },
    legend: topLegend(palette, ['실측 발전량', '기대 발전량', '발전시간']),
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
        name: 'h',
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11 },
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
        name: '발전시간',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: palette.irradiance, width: 2 },
        itemStyle: { color: palette.irradiance },
        data: points.map((point) => point.hours),
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
          description={`${label} 기준. 기간 평균 발전시간은 하루 ${formatNumber(summary.hours, 2)}시간입니다.`}
        >
          <HealthGauge report={report} />
        </Card>
      </Reveal>

      <div className={styles.grid2}>
        <Reveal delay={0.06}>
          <PerformancePane
            title="발전시간"
            hint="발전량을 설비용량으로 나눈 값. 용량이 다른 설비도 그대로 견줄 수 있습니다."
            metric="hours"
            points={points}
            previousAverage={previous.hours}
            threshold={LOW_HOURS}
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
          description={`막대는 실측 발전량, 점선은 일사량으로 계산한 기대 발전량, 선은 발전시간입니다. 발전시간이 ${LOW_HOURS}시간에 못 미친 날이 ${formatNumber(
            lowDays,
          )}일 있습니다.`}
        >
          <EChart
            option={option}
            height={320}
            summary={`${label}의 기간 내 실측 ${formatNumber(summary.actualKwh / 1000, 1)}MWh, 기대 ${formatNumber(
              summary.expectedKwh / 1000,
              1,
            )}MWh, 평균 발전시간 ${formatNumber(summary.hours, 2)}시간.`}
          />
        </Card>
      </Reveal>
    </div>
  );
}
