import { useState } from 'react';
import { describeDetail, DETAIL_TITLE, DETAIL_UNIT, pickEnergyUnit } from '@/mocks/generation';
import { EChart } from '@/components/common/EChart';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { PeriodKey } from '@/mocks/generation';
import styles from '../Statistics.module.scss';
import { InverterTimeTable } from './InverterTimeTable';
import type { EChartsOption } from 'echarts';
import type { StatisticsView } from '../hooks/useStatisticsView';

type DetailView = 'chart' | 'table';

const DETAIL_VIEW_OPTIONS: { value: DetailView; label: string }[] = [
  { value: 'chart', label: '차트' },
  { value: 'table', label: '표' },
];

/** 겹쳐 견주는 하나 전 기간 (SFR-007-03) */
const COMPARE_LABEL: Record<PeriodKey, string> = {
  day: '전일',
  month: '전월',
  year: '전년',
};

/** 이 판의 제목과 설명 — 이제 칸을 바깥에서 씌우므로 문구도 바깥이 가져다 쓴다 */
export function detailTrendHead(view: StatisticsView) {
  const { period, date, stat, detail } = view;
  const unit = pickEnergyUnit(stat.generationKwh);
  const total = stat.series.reduce((sum, value) => sum + value, 0);
  const peakIndex = stat.series.reduce((best, value, index) => (value > stat.series[best] ? index : best), 0);

  return {
    title: `${DETAIL_TITLE[period]} 발전량`,
    description: `${describeDetail(period, date)} · 최고는 ${detail[peakIndex]?.label ?? '—'}, `
      + `합계 ${formatNumber(total / unit.divider, 2)}${unit.unit}입니다. `
      + `점선 막대는 ${COMPARE_LABEL[period]}이라 같은 기준으로 비교할 수 있습니다.`,
  };
}

/**
 * 시점별 발전량 추이 — 막대(발전량)와 선(일사강도)을 한 판에 겹친다.
 *
 * 하나 전 같은 기간은 테두리만 있는 점선 막대로 뒤에 깔아, 같은 눈금 위에서 높낮이만
 * 비교하게 한다 (SFR-007-03). 같은 값을 숫자로 확인하고 싶은 사람을 위해 표로도 바꿀 수 있다.
 *
 * 칸(`Card`)은 이 부품이 씌우지 않는다. 인버터별 추이와 한 칸 안에서 번갈아 서기 때문에,
 * 칸과 제목은 그 둘을 쥔 바깥이 맡는다.
 */
export function DetailTrend({ view }: { view: StatisticsView }) {
  const { label, period, date, stat, previous, detail } = view;
  const [detailView, setDetailView] = useState<DetailView>('chart');
  const palette = useChartPalette();

  const unit = pickEnergyUnit(Math.max(...stat.series, 1));

  const option: EChartsOption = {
    grid: { top: LEGEND_GRID_TOP, right: 52, bottom: 30, left: 58 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
    },
    legend: topLegend(palette, ['발전량', COMPARE_LABEL[period], '일사강도']),
    xAxis: {
      type: 'category',
      data: detail.map((point) => point.label),
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
    },
    yAxis: [
      {
        type: 'value',
        name: unit.unit,
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11, padding: [0, 0, 0, -30] },
        splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
        axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
      },
      {
        type: 'value',
        name: 'W/m²',
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11 },
        splitLine: { show: false },
        axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
      },
    ],
    series: [
      {
        name: '발전량',
        type: 'bar',
        barMaxWidth: 22,
        itemStyle: { color: palette.generation, borderRadius: [4, 4, 0, 0] },
        data: stat.series.map((value) => Number((value / unit.divider).toFixed(2))),
        animationDuration: 700,
        animationDelay: (index: number) => index * 24,
      },
      // 하나 전 기간은 테두리만 있는 막대로 겹쳐, 같은 눈금 위에서 높낮이만 견주게 한다.
      {
        name: COMPARE_LABEL[period],
        type: 'bar',
        barMaxWidth: 22,
        barGap: '-100%',
        z: 1,
        itemStyle: {
          color: 'transparent',
          borderColor: palette.axis,
          borderWidth: 1,
          borderType: 'dashed',
          borderRadius: [4, 4, 0, 0],
        },
        data: previous.series.map((value) => Number((value / unit.divider).toFixed(2))),
        animationDuration: 700,
      },
      {
        name: '일사강도',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: palette.irradiance, width: 2 },
        itemStyle: { color: palette.irradiance },
        data: detail.map((point) => point.irradiance),
        animationDuration: 800,
        animationDelay: 260,
      },
    ],
  };

  return (
    <>
      {/* 같은 값을 숫자로 보고 싶은 사람을 위해 — 판 위 오른쪽에 둔다 */}
      <div className={styles.trendBar}>
        <SegmentedControl
          label="보기 방식"
          size="sm"
          options={DETAIL_VIEW_OPTIONS}
          value={detailView}
          onChange={setDetailView}
        />
      </div>

      {detailView === 'chart' ? (
        <EChart
          option={option}
          height={320}
          summary={`${label}의 ${describeDetail(period, date)} ${DETAIL_UNIT[period]}별 발전량 추이.`}
        />
      ) : (
        <InverterTimeTable
          labels={detail.map((point) => point.label)}
          generation={stat.series}
          irradiance={detail.map((point) => point.irradiance)}
          caption={`${label}의 ${DETAIL_UNIT[period]}별 발전량, 일사강도 표`}
        />
      )}
    </>
  );
}
