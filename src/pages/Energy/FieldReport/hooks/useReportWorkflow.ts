import { NOW } from '@/mocks/today';
import { REPORT_STATE_LABEL } from '@/mocks/fieldReport';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useFieldReportStore from '@/stores/fieldReportStore';
import type { FieldReport, ReportState } from '@/interface/fieldReport';

/**
 * 보고서 상태를 옮기는 일 (SFR-021-08/09/18).
 * 처리·반려가 모두 이력 한 줄을 붙이므로 만드는 자리를 하나로 둔다.
 */
export function useReportWorkflow() {
  const patch = useFieldReportStore((state) => state.patch);
  const actor = useAuthUser();

  const push = (report: FieldReport, change: string, extra?: Partial<FieldReport>) => {
    patch(report.id, {
      ...extra,
      history: [
        ...report.history,
        { at: NOW.format('YYYY-MM-DD HH:mm'), actor: actor?.name ?? '담당자', change },
      ],
    });
  };

  return {
    /** 고른 상태를 그대로 매긴다 — 단계를 밟아 나아가지 않는다 (SFR-021-08) */
    setState: (report: FieldReport, next: ReportState) => {
      push(report, `${REPORT_STATE_LABEL[next]}(으)로 바꿨습니다.`, { state: next });
      toast.success(`${REPORT_STATE_LABEL[next]}(으)로 처리했습니다.`);
    },

    /** 검토에서 되돌려 보낸다 — 현장이 고쳐 다시 낸다 (SFR-021-08/09) */
    reject: (report: FieldReport, reason: string) => {
      push(report, `반려했습니다. — ${reason}`, { state: 'rejected', rejectReason: reason });
      toast.success(`${report.schoolName} 보고서를 반려했습니다.`);
    },
  };
}
