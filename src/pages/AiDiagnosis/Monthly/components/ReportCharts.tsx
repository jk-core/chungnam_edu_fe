import { EChart } from '@/components/common/EChart';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, SERIES_DASH, seriesPalette, topLegend } from '@/utils/chart';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { MonthlyReport } from '@/mocks/reports';
import type { EChartsOption } from 'echarts';

/*
  월간보고서가 쓰는 차트 세 벌 (SFR-019-02/03/04, SFR-020-01/02).

  보고서는 종이로 나가는 산출물이라 화면용 차트와 다르게 잡는다 —
  움직임을 끄고(`animation: false`), 눈금 글씨를 키우고, 범례를 늘 펼쳐 둔다.
  종이에서는 마우스를 올릴 수 없으니 툴팁에 기대지 않는다.
*/

const AXIS_FONT = { fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' };

/** 지면에 차트가 하나뿐일 때 쓰는 기본 높이. 여러 개면 장마다 나눠 정한다. */
const CHART_HEIGHT = 260;

/** 보고서 차트가 함께 쓰는 밑바탕 */
function reportBase(): Partial<EChartsOption> {
  return {
    animation: false,
    grid: { top: LEGEND_GRID_TOP, right: 24, bottom: 28, left: 56 },
  };
}

interface TrendChartProps {
  report: MonthlyReport;
  /** 지면에 남는 높이를 나눠 받는다 — 장마다 차트 수가 달라 밖에서 정한다 */
  height?: number;
}

/**
 * 발전소 발전량 추이 (SFR-019-02).
 * 금월과 전월을 같은 눈금 위에 겹쳐, 며칠에 벌어지고 며칠에 붙는지를 모양으로 읽게 한다.
 */
export function TrendChart({ report, height = CHART_HEIGHT }: TrendChartProps) {
  const palette = useChartPalette();
  const labels = report.dailyCompare.map((item) => `${item.day}일`);

  const option: EChartsOption = {
    ...reportBase(),
    legend: topLegend(palette, ['금월 발전량', '전월 발전량']),
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, interval: 2, ...AXIS_FONT },
    },
    yAxis: {
      type: 'value',
      name: 'kWh',
      nameGap: AXIS_NAME_GAP,
      nameTextStyle: { color: palette.textMuted, fontSize: 11 },
      splitLine: { lineStyle: { color: palette.grid } },
      axisLabel: { color: palette.axis, ...AXIS_FONT },
    },
    series: [
      {
        name: '금월 발전량',
        type: 'line',
        smooth: true,
        symbol: 'none',
        itemStyle: { color: palette.generation },
        lineStyle: { color: palette.generation, width: 2.4 },
        areaStyle: { color: palette.generationSoft, opacity: 0.4 },
        data: report.dailyCompare.map((item) => item.current),
      },
      {
        name: '전월 발전량',
        type: 'line',
        smooth: true,
        symbol: 'none',
        itemStyle: { color: palette.compare },
        lineStyle: { color: palette.compare, width: 1.8, type: 'dashed' },
        data: report.dailyCompare.map((item) => item.previous),
      },
    ],
  };

  return (
    <EChart
      option={option}
      height={height}
      summary={`일별 발전량 추이입니다. 금월 합계 ${formatNumber(report.totalKwh)}kWh, 전월 합계 ${formatNumber(report.previousKwh)}kWh 입니다.`}
    />
  );
}

/**
 * 인버터별 발전시간 (SFR-019-03/04).
 * 인버터마다 색과 선 모양을 달리해, 한 대만 처지는 날이 눈에 걸리게 한다.
 */
export function InverterHoursChart({ report, height = CHART_HEIGHT }: TrendChartProps) {
  const palette = useChartPalette();
  const colors = seriesPalette(palette);
  const labels = report.dailyCompare.map((item) => `${item.day}일`);

  const option: EChartsOption = {
    ...reportBase(),
    legend: { ...topLegend(palette, report.inverterHours.map((item) => item.name)), top: 0, left: 0, right: 'auto' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, interval: 2, ...AXIS_FONT },
    },
    yAxis: {
      type: 'value',
      name: '시간',
      nameGap: AXIS_NAME_GAP,
      nameTextStyle: { color: palette.textMuted, fontSize: 11 },
      splitLine: { lineStyle: { color: palette.grid } },
      axisLabel: { color: palette.axis, ...AXIS_FONT },
    },
    series: report.inverterHours.map((inverter, index) => ({
      name: inverter.name,
      type: 'line',
      smooth: true,
      symbol: 'none',
      itemStyle: { color: colors[index % colors.length] },
      lineStyle: {
        color: colors[index % colors.length],
        width: 2,
        type: SERIES_DASH[index % SERIES_DASH.length],
      },
      data: inverter.daily,
    })),
  };

  return (
    <EChart
      option={option}
      height={height}
      summary={`인버터 ${report.inverterHours.length}대의 일별 발전시간입니다.`}
    />
  );
}

interface DiagnosisChartProps {
  diagnosis: MonthlyReport['inverterDiagnosis'][number];
  height?: number;
}

/**
 * 인버터 진단 그래프 — 정상 범위와 측정값 (SFR-020-01).
 *
 * 정상 범위는 날마다 폭이 달라 `markArea` 로는 그릴 수 없다. 투명한 하한선 위에
 * (상한 − 하한) 높이를 쌓아 띠를 만든다 — 띠를 벗어난 날이 곧 진단이 잡아낸 날이다.
 */
export function DiagnosisChart({ diagnosis, height = CHART_HEIGHT }: DiagnosisChartProps) {
  const palette = useChartPalette();
  const labels = diagnosis.daily.map((item) => `${item.day}일`);
  const faultDays = diagnosis.daily.filter((item) => item.code > 0).length;

  const option: EChartsOption = {
    ...reportBase(),
    legend: topLegend(palette, ['정상 범위', '측정값']),
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, interval: 2, ...AXIS_FONT },
    },
    yAxis: {
      type: 'value',
      name: 'kWh',
      nameGap: AXIS_NAME_GAP,
      nameTextStyle: { color: palette.textMuted, fontSize: 11 },
      splitLine: { lineStyle: { color: palette.grid } },
      axisLabel: { color: palette.axis, ...AXIS_FONT },
    },
    series: [
      {
        // 띠의 밑동. 보이지 않아야 하므로 선도 범례도 끈다.
        name: '정상 범위 하단',
        type: 'line',
        stack: 'band',
        symbol: 'none',
        lineStyle: { opacity: 0 },
        itemStyle: { opacity: 0 },
        tooltip: { show: false },
        silent: true,
        data: diagnosis.daily.map((item) => item.normalLow),
      },
      {
        name: '정상 범위',
        type: 'line',
        stack: 'band',
        symbol: 'none',
        lineStyle: { width: 0 },
        itemStyle: { color: palette.okSoft },
        areaStyle: { color: palette.okSoft, opacity: 0.85 },
        silent: true,
        data: diagnosis.daily.map((item) => item.normalHigh - item.normalLow),
      },
      {
        name: '측정값',
        type: 'line',
        z: 3,
        smooth: true,
        // 고장으로 잡힌 날에만 점을 찍어 어느 날인지 짚어 준다.
        symbol: (_value, params) => (diagnosis.daily[params.dataIndex]?.code > 0 ? 'circle' : 'none'),
        symbolSize: 7,
        itemStyle: {
          color: (params) => (diagnosis.daily[params.dataIndex]?.code > 0 ? palette.critical : palette.generation),
        },
        lineStyle: { color: palette.generation, width: 2.4 },
        data: diagnosis.daily.map((item) => item.actual),
      },
    ],
  };

  return (
    <EChart
      option={option}
      height={height}
      summary={`${diagnosis.name}의 일별 정상 범위와 측정값입니다. 고장으로 분류된 날은 ${faultDays}일입니다.`}
    />
  );
}

interface StringChartProps {
  units: MonthlyReport['unitDiagnosis'];
  days: number;
  height?: number;
}

/**
 * 스트링 효율 (SFR-020-02).
 * 정상 범위는 88~104% 로 고정이라 `markArea` 대신 같은 값을 쌓아 띠로 만든다.
 */
export function StringEfficiencyChart({ units, days, height = CHART_HEIGHT }: StringChartProps) {
  const palette = useChartPalette();
  const colors = seriesPalette(palette);
  const labels = Array.from({ length: days }, (_, index) => `${index + 1}일`);
  const LOW = 88;
  const HIGH = 104;

  const option: EChartsOption = {
    ...reportBase(),
    legend: { ...topLegend(palette, units.map((unit) => unit.name)), top: 0, left: 0, right: 'auto', type: 'scroll' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, interval: 2, ...AXIS_FONT },
    },
    yAxis: {
      type: 'value',
      name: '%',
      nameGap: AXIS_NAME_GAP,
      nameTextStyle: { color: palette.textMuted, fontSize: 11 },
      splitLine: { lineStyle: { color: palette.grid } },
      axisLabel: { color: palette.axis, ...AXIS_FONT },
    },
    series: [
      {
        name: '정상 범위 하단',
        type: 'line',
        stack: 'band',
        symbol: 'none',
        lineStyle: { opacity: 0 },
        itemStyle: { opacity: 0 },
        tooltip: { show: false },
        silent: true,
        data: labels.map(() => LOW),
      },
      {
        name: '정상 범위',
        type: 'line',
        stack: 'band',
        symbol: 'none',
        lineStyle: { width: 0 },
        itemStyle: { color: palette.okSoft },
        areaStyle: { color: palette.okSoft, opacity: 0.85 },
        silent: true,
        data: labels.map(() => HIGH - LOW),
      },
      ...units.map((unit, index) => ({
        name: unit.name,
        type: 'line' as const,
        z: 3,
        smooth: true,
        symbol: 'none' as const,
        itemStyle: { color: colors[index % colors.length] },
        lineStyle: {
          color: colors[index % colors.length],
          width: 1.8,
          type: SERIES_DASH[index % SERIES_DASH.length],
        },
        data: unit.daily,
      })),
    ],
  };

  return (
    <EChart
      option={option}
      height={height}
      summary={`회로 ${units.length}개의 일별 효율입니다. 정상 범위는 ${LOW}~${HIGH}% 입니다.`}
    />
  );
}
