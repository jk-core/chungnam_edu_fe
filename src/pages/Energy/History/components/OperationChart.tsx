import dayjs from 'dayjs';
import { EChart } from '@/components/common/EChart';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { OperationRaw } from '@/interface/operation';
import type { EChartsOption } from 'echarts';

interface OperationChartProps {
  /** 시간 오름차순 계측 — 표와 같은 자료를 쓴다 */
  rows: OperationRaw[];
  inverterName: string;
}

/**
 * 운전이력 그래프 보기 (SFR-010-03/04).
 *
 * 표가 한 줄씩 확인하는 자리라면 이쪽은 하루의 모양을 본다 — 전압·전류·전력을 한 판에 겹쳐,
 * 어느 시각에 무엇이 먼저 흔들렸는지 좌우로 훑을 수 있게 한다.
 * 전력만 축이 크게 달라 왼쪽에 두고, 전압·전류는 오른쪽 축을 함께 쓴다.
 */
export function OperationChart({ rows, inverterName }: OperationChartProps) {
  const palette = useChartPalette();
  const labels = rows.map((row) => dayjs(row.at).format('HH:mm'));

  // 결측 줄은 0 이 아니라 선을 끊는다 — 0 으로 이으면 발전이 멈춘 것처럼 읽힌다.
  const pick = (read: (row: OperationRaw) => number | null) =>
    rows.map((row) => (row.state === 'missing' ? null : read(row)));

  const option: EChartsOption = {
    grid: { top: LEGEND_GRID_TOP, right: 56, bottom: 30, left: 58 },
    legend: topLegend(palette, ['출력 전력', '출력 전압', '출력 전류']),
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const index = Number(list[0]?.dataIndex ?? 0);
        const row = rows[index];

        if (!row) return '';

        if (row.state === 'missing') return `<strong>${dayjs(row.at).format('HH:mm')}</strong><br/>결측`;

        return [
          `<strong>${dayjs(row.at).format('HH:mm:ss')}</strong>`,
          `전력 ${formatNumber(row.acWatt ?? 0)}W`,
          `전압 ${formatNumber(row.acVolt ?? 0, 1)}V`,
          `전류 ${formatNumber(row.acAmp ?? 0, 1)}A`,
          `누적 ${formatNumber(row.accumWh)}Wh`,
        ].join('<br/>');
      },
    },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 11, hideOverlap: true },
    },
    yAxis: [
      {
        type: 'value',
        name: 'W',
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11, padding: [0, 0, 0, -30] },
        splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
        axisLabel: { color: palette.axis, fontSize: 11 },
      },
      {
        type: 'value',
        name: 'V · A',
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11 },
        splitLine: { show: false },
        axisLabel: { color: palette.axis, fontSize: 11 },
      },
    ],
    dataZoom: [
      { type: 'inside', zoomOnMouseWheel: 'shift', moveOnMouseWheel: false },
      { type: 'slider', height: 16, bottom: 4, borderColor: palette.border, textStyle: { color: palette.axis, fontSize: 10 } },
    ],
    series: [
      {
        name: '출력 전력',
        type: 'line',
        smooth: true,
        showSymbol: false,
        areaStyle: { color: palette.generationSoft, opacity: 0.5 },
        lineStyle: { color: palette.generation, width: 2 },
        itemStyle: { color: palette.generation },
        data: pick((row) => row.acWatt),
      },
      {
        name: '출력 전압',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: palette.irradiance, width: 1.6 },
        itemStyle: { color: palette.irradiance },
        data: pick((row) => row.acVolt),
      },
      {
        name: '출력 전류',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: palette.compare, width: 1.6, type: 'dashed' },
        itemStyle: { color: palette.compare },
        data: pick((row) => row.acAmp),
      },
    ],
  };

  return (
    <EChart
      option={option}
      height={320}
      summary={`${inverterName}의 수집주기별 출력 전력·전압·전류 추이. 결측 구간은 선을 끊었습니다.`}
    />
  );
}
