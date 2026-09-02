import { useState } from 'react';
import { NOW } from '@/mocks/today';
import { REPORT_STATE_LABEL } from '@/mocks/fieldReport';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useFieldReportStore from '@/stores/fieldReportStore';
import type { FieldReport, ReportState } from '@/interface/fieldReport';

/**
 * 보고서 검토 흐름 (SFR-021-08).
 *
 * 검토·반려·확인은 「상태를 옮기고 이력을 한 줄 남긴다」는 점이 같아 한곳에 모았다.
 * 무엇을 매길지는 표의 버튼이 정하고, 실제 처리는 확인 창에서 이뤄진다 —
 * 반려만 사유를 받아야 해서 창이 따로다.
 */
export function useReportReview() {
  const patch = useFieldReportStore((state) => state.patch);
  const actor = useAuthUser();

  const [pending, setPending] = useState<{ report: FieldReport; state: ReportState } | null>(null);
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

  const apply = () => {
    if (!pending) return;

    move(pending.report, pending.state, `${REPORT_STATE_LABEL[pending.state]}(으)로 바꿨습니다.`);
    toast.success(`${pending.report.schoolName} 보고서를 ${REPORT_STATE_LABEL[pending.state]}(으)로 처리했습니다.`);
    setPending(null);
  };

  /*
    사유는 그 보고서 것이다 — 창을 어떻게 닫든 함께 비운다.
    취소로만 닫고 비우지 않았더니, 다음 보고서 반려창이 앞 사유를 담은 채 버튼까지 활성으로 열렸다.
  */
  const endReject = () => {
    setRejecting(null);
    setReason('');
  };

  const reject = () => {
    const trimmed = reason.trim();

    if (!rejecting || !trimmed) return;

    move(rejecting, 'rejected', `반려했습니다. — ${trimmed}`, { rejectReason: trimmed });
    toast.success(`${rejecting.schoolName} 보고서를 반려했습니다.`);
    endReject();
  };

  return {
    pending,
    rejecting,
    reason,
    setReason,
    /** 반려만 사유를 받아야 해서 다른 창으로 보낸다 */
    ask: (report: FieldReport, state: ReportState) => (
      state === 'rejected' ? setRejecting(report) : setPending({ report, state })
    ),
    closePending: () => setPending(null),
    closeReject: endReject,
    apply,
    reject,
  };
}
