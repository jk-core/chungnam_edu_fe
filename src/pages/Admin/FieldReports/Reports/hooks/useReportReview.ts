import { useState } from 'react';
import { NOW } from '@/mocks/today';
import { REPORT_STATE_LABEL } from '@/mocks/fieldReport';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useFieldReportStore from '@/stores/fieldReportStore';
import type { FieldReport, ReportState } from '@/interface/fieldReport';
import { nextStateOf } from '../components/reportState';

/**
 * 보고서 검토 흐름 (SFR-021-08).
 *
 * 진행과 반려는 확인 절차만 다를 뿐 「상태를 옮기고 이력을 한 줄 남긴다」는 점이 같아
 * 한곳에 모았다. 무엇을 처리하려는지(advancing·rejecting)는 표의 버튼이 정하고,
 * 실제 처리는 확인 창에서 이뤄진다.
 */
export function useReportReview() {
  const patch = useFieldReportStore((state) => state.patch);
  const actor = useAuthUser();

  const [advancing, setAdvancing] = useState<FieldReport | null>(null);
  const [rejecting, setRejecting] = useState<FieldReport | null>(null);
  const [reason, setReason] = useState('');

  const move = (report: FieldReport, next: ReportState, change: string, extra?: Partial<FieldReport>) => {
    patch(report.id, {
      state: next,
      ...extra,
      history: [
        ...report.history,
        { at: NOW.format('YYYY-MM-DD HH:mm'), actor: actor?.name ?? '관리자', change },
      ],
    });
  };

  const advance = () => {
    const next = advancing && nextStateOf(advancing.state);

    if (!advancing || !next) return;

    move(advancing, next, `${REPORT_STATE_LABEL[next]}(으)로 바꿨습니다.`);
    toast.success(`${advancing.schoolName} 보고서를 ${REPORT_STATE_LABEL[next]}(으)로 처리했습니다.`);
    setAdvancing(null);
  };

  const reject = () => {
    const trimmed = reason.trim();

    if (!rejecting || !trimmed) return;

    move(rejecting, 'rejected', `반려했습니다. — ${trimmed}`, { rejectReason: trimmed });
    toast.success(`${rejecting.schoolName} 보고서를 반려했습니다.`);
    setRejecting(null);
    setReason('');
  };

  return {
    advancing,
    rejecting,
    reason,
    setReason,
    askAdvance: setAdvancing,
    askReject: setRejecting,
    closeAdvance: () => setAdvancing(null),
    closeReject: () => setRejecting(null),
    advance,
    reject,
  };
}
