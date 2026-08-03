import type { ChartPalette } from '@/hooks/useChartPalette';
import type { EChartsOption, LineSeriesOption } from 'echarts';

type MarkArea = NonNullable<LineSeriesOption['markArea']>;
type MarkLine = NonNullable<LineSeriesOption['markLine']>;

/**
 * 범례가 있는 차트의 상단 여백.
 * y 축 이름은 축 위쪽 끝에 붙는데, 범례를 같은 높이에 두면 오른쪽 축 이름과 겹친다.
 * 범례가 맨 윗줄을 통째로 쓰고 축 이름은 그 아래 눈금 바로 위에 앉도록 띄운다.
 */
export const LEGEND_GRID_TOP = 58;

/** 축 이름과 눈금 사이 거리. LEGEND_GRID_TOP 과 짝이다. */
export const AXIS_NAME_GAP = 12;

/** 차트 위쪽에 놓는 범례. 모든 차트가 같은 모양을 쓰도록 한곳에서 만든다. */
export function topLegend(palette: ChartPalette, data?: string[]): EChartsOption['legend'] {
  return {
    top: 0,
    right: 0,
    icon: 'roundRect',
    itemWidth: 10,
    itemHeight: 10,
    textStyle: { color: palette.textMuted, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
    ...(data ? { data } : {}),
  };
}

/** 여러 갈래를 나란히 그릴 때 쓰는 색 순서 (SFR-008-06) */
export function seriesPalette(palette: ChartPalette): string[] {
  return [
    palette.series1,
    palette.series2,
    palette.series3,
    palette.series4,
    palette.series5,
    palette.series6,
    palette.series7,
    palette.series8,
  ];
}

/** 색만으로 구분하지 않도록 선 모양도 함께 돌린다 (COR-003) */
export const SERIES_DASH: ('solid' | 'dashed' | 'dotted')[] = ['solid', 'dashed', 'dotted', 'solid', 'dashed', 'dotted', 'solid', 'dashed'];

/**
 * y 축의 정상 범위를 옅은 띠로 깐다 (SFR-013-03).
 * markArea 는 silent 로 두어 마우스가 걸리지 않게 한다.
 */
export function normalBand(min: number, max: number, color: string): MarkArea {
  return {
    silent: true,
    itemStyle: { color },
    label: { show: false },
    data: [[{ yAxis: min }, { yAxis: max }]],
  };
}

/** 기준선 하나 */
export function thresholdLine(value: number, color: string, label: string): MarkLine {
  return {
    silent: true,
    symbol: 'none' as const,
    lineStyle: { color, type: 'dashed' as const, width: 1.4 },
    label: { formatter: label, position: 'insideEndTop' as const, color, fontSize: 11 },
    data: [{ yAxis: value }],
  };
}

export interface TooltipRow {
  label: string;
  value: string;
  tone?: 'ok' | 'caution' | 'critical' | 'muted';
}

/**
 * 추정값·측정값·편차·진단 결과를 한 정보창에 묶는다 (SFR-013-05/10).
 * echarts tooltip 은 HTML 문자열을 받으므로 CSS Module 을 쓸 수 없어 색을 인라인으로 넣는다.
 */
export function buildCompareTooltip(args: {
  title: string;
  estimate: { label: string; value: number; unit: string };
  measured: { label: string; value: number; unit: string };
  rows: TooltipRow[];
  palette: ChartPalette;
}): string {
  const { title, estimate, measured, rows, palette } = args;
  const peak = Math.max(estimate.value, measured.value, 1);
  const toneColor = (tone: TooltipRow['tone']) => {
    if (tone === 'ok') return palette.ok;
    if (tone === 'caution') return palette.caution;
    if (tone === 'critical') return palette.critical;

    return palette.textMuted;
  };

  const bar = (value: number, color: string, label: string, unit: string) => `
    <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
      <span style="width:52px;font-size:11px;color:${palette.textMuted}">${label}</span>
      <span style="position:relative;flex:1;height:8px;border-radius:4px;background:${palette.grid};overflow:hidden">
        <span style="display:block;height:100%;width:${(value / peak) * 100}%;background:${color}"></span>
      </span>
      <span style="width:74px;text-align:right;font-size:11px;color:${palette.text}">
        ${value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}${unit}
      </span>
    </div>`;

  const row = (item: TooltipRow) => `
    <div style="display:flex;justify-content:space-between;gap:12px;margin-top:3px">
      <span style="font-size:11px;color:${palette.textMuted}">${item.label}</span>
      <span style="font-size:11px;font-weight:600;color:${toneColor(item.tone)}">${item.value}</span>
    </div>`;

  return `
    <div style="min-width:228px;font-family:'Pretendard Variable',sans-serif">
      <div style="font-size:12px;font-weight:600;color:${palette.text};margin-bottom:2px">${title}</div>
      ${bar(estimate.value, palette.compare, estimate.label, estimate.unit)}
      ${bar(measured.value, palette.generation, measured.label, measured.unit)}
      <div style="margin-top:8px;padding-top:6px;border-top:1px solid ${palette.border}">
        ${rows.map(row).join('')}
      </div>
    </div>`;
}
