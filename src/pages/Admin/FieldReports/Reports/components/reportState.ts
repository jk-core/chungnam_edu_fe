import { REPORT_STATE_LABEL, STATE_ORDER } from '@/mocks/fieldReport';
import type { BadgeTone } from '@/components/common/Badge';
import type { ReportState } from '@/interface/fieldReport';

export const STATE_TONE: Record<ReportState, BadgeTone> = {
  draft: 'neutral',
  submitted: 'brand',
  reviewing: 'caution',
  confirmed: 'ok',
  rejected: 'critical',
};

/** 상태 필터 — 전체를 앞에 세운다 */
export const STATE_FILTER: { value: string; label: string }[] = [
  { value: '', label: '전체 상태' },
  ...[...STATE_ORDER, 'rejected' as ReportState].map((state) => ({
    value: state,
    label: REPORT_STATE_LABEL[state],
  })),
];

/**
 * 다음으로 넘길 상태. 마지막 단계이거나 반려된 보고서는 넘길 곳이 없어 null 이다.
 * 반려는 STATE_ORDER 밖에 있으므로 자리를 찾지 못해 그대로 걸러진다.
 */
export function nextStateOf(state: ReportState): ReportState | null {
  const index = STATE_ORDER.indexOf(state);

  return index >= 0 && index < STATE_ORDER.length - 1 ? STATE_ORDER[index + 1] : null;
}

/** 반려는 현장이 아직 손댈 수 있는 동안에만 가능하다 */
export function canReject(state: ReportState): boolean {
  return state === 'submitted' || state === 'reviewing';
}
