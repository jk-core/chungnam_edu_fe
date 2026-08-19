import { DETAIL_UNIT } from '@/mocks/generation';
import { EChart } from '@/components/common/EChart';
import { KIND_LABEL } from '@/mocks/tree';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, seriesPalette, topLegend } from '@/utils/chart';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { NodeKind } from '@/interface/tree';
import type { PeriodKey } from '@/mocks/generation';
import type { EChartsOption } from 'echarts';
import type { StatisticsView } from '../hooks/useStatisticsView';

/** 색이 여덟 개를 넘어 돌 때 선 모양으로 한 번 더 가른다 (COR-003-03) */
const DASH = ['solid', 'dashed', 'dotted'] as const;

interface ChildCompareChartProps {
  view: StatisticsView;
  childKind: NodeKind;
}

/** 이 판의 제목과 설명 — 칸을 바깥에서 씌우므로 문구도 바깥이 가져다 쓴다 */
export function childCompareHead(period: PeriodKey, childKind: NodeKind) {
  return {
    title: `${DETAIL_UNIT[period]}별 ${KIND_LABEL[childKind]} 발전시간`,
    description: `${KIND_LABEL[childKind]}마다 다른 색과 선 모양으로 구분했습니다. `
      + `선 위에 마우스를 올리면 그 ${DETAIL_UNIT[period]}의 값이 한꺼번에 나옵니다.`,
  };
}

/**
 * 하위 설비별 발전시간을 한 판에 겹친 차트 (SFR-008-05/06/07).
 *
 * 발전량을 그대로 겹치면 용량 큰 설비가 판을 덮어 버린다. 설비용량으로 나눈 발전시간이라야
 * 크기가 다른 설비를 같은 눈금 위에서 비교할 수 있다. 설비마다 다른 색을 주고 한 시점의
 * 모든 설비 값을 툴팁 하나에 모아, 어느 설비가 언제 처졌는지 좌우로 훑어볼 수 있게 한다.
 *
 * 칸(`Card`)은 씌우지 않는다 — 시점별 추이와 한 칸 안에서 번갈아 선다.
 */
export function ChildCompareChart({ view, childKind }: ChildCompareChartProps) {
  const { label, period, detail, childStats } = view;
  const palette = useChartPalette();
  const childColors = seriesPalette(palette);

  const option: EChartsOption = {
    grid: { top: LEGEND_GRID_TOP, right: 24, bottom: 30, left: 52 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
      valueFormatter: (value) => `${formatNumber(Number(value), 2)} h`,
    },
    legend: topLegend(palette, childStats.map((child) => child.node.name)),
    xAxis: {
      type: 'category',
      data: detail.map((point) => point.label),
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
    },
    yAxis: {
      type: 'value',
      name: 'h',
      nameGap: AXIS_NAME_GAP,
      nameTextStyle: { color: palette.axis, fontSize: 11, padding: [0, 0, 0, -24] },
      splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
      axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
    },
    series: childStats.map((child, index) => ({
      name: child.node.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      // 색만으로 구분되지 않게 선 모양도 함께 바꾼다 (COR-003-03)
      lineStyle: { color: childColors[index % childColors.length], width: 2, type: DASH[index % DASH.length] },
      itemStyle: { color: childColors[index % childColors.length] },
      data: child.series.map((value) => (child.node.capacityKw > 0 ? Number((value / child.node.capacityKw).toFixed(2)) : 0)),
    })),
  };

  return (
    <EChart
      option={option}
      height={320}
      summary={`${label} 아래 ${KIND_LABEL[childKind]} ${childStats.length}개의 ${DETAIL_UNIT[period]}별 발전시간 비교.`}
    />
  );
}
