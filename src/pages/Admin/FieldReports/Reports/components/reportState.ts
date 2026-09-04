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
