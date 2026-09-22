import { getFaultCode } from '@/mocks/faultCodes';
import type { ChartPalette } from '@/hooks/useChartPalette';
import type { DiagnosisFaultCode } from '@/interface/equipment';

interface TooltipRow {
  label: string;
  value: string;
  /** 그 줄만 눈에 먼저 들어와야 할 때 */
  strong?: boolean;
  color?: string;
}

interface TrendTooltipArgs {
  title: string;
  rows: TooltipRow[];
  fault: { code: DiagnosisFaultCode | null; name: string | null };
  palette: ChartPalette;
}

/**
 * 계측 추이의 통합 정보창 (SFR-013-10).
 *
 * echarts 툴팁은 HTML 문자열을 받는다 — CSS Module 이 닿지 않아 색을 인라인으로 넣는다.
 * 진단 줄의 색은 고장코드 사전이 이미 쥔 `severity` 를 따른다. 코드마다 색을 새로 정하면
 * 표의 칸 색과 두 벌이 되어 같은 코드가 자리마다 다른 색으로 읽힌다.
 */
export function trendTooltip({ title, rows, fault, palette }: TrendTooltipArgs): string {
  const line = (row: TooltipRow) => `
    <div style="display:flex;gap:12px;align-items:baseline;margin-top:3px">
      <span style="min-width:58px;font-size:11px;color:${palette.textMuted}">${row.label}</span>
      <span style="flex:1;text-align:right;font-size:12px;color:${row.color ?? palette.text};font-weight:${row.strong ? 600 : 400}">
        ${row.value}
      </span>
    </div>`;

  return `
    <div style="min-width:196px">
      <strong style="display:block;font-size:12px;color:${palette.text}">${title}</strong>
      ${rows.map(line).join('')}
      <div style="display:flex;gap:8px;align-items:center;margin-top:6px;padding-top:6px;border-top:1px solid ${palette.grid}">
        <span style="width:8px;height:8px;border-radius:50%;background:${faultColor(fault.code, palette)}"></span>
        <span style="font-size:11px;color:${palette.textMuted}">진단</span>
        <span style="flex:1;text-align:right;font-size:12px;color:${palette.text}">${faultText(fault)}</span>
      </div>
    </div>`;
}

/** 진단이 안 붙은 시점은 「정상」이 아니라 「모름」이다 */
function faultText({ code, name }: TrendTooltipArgs['fault']): string {
  if (code === null) return '—';

  return name?.trim() || (getFaultCode(code)?.label ?? '—');
}

function faultColor(code: DiagnosisFaultCode | null, palette: ChartPalette): string {
  if (code === null) return palette.grid;

  const severity = getFaultCode(code)?.severity;

  if (severity === 'critical') return palette.critical;
  if (severity === 'caution') return palette.caution;

  return palette.ok;
}
