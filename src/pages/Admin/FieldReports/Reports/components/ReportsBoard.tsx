import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { REPORT_STATE_LABEL } from '@/mocks/fieldReport';
import useFieldReportStore, { mergeFieldReports } from '@/stores/fieldReportStore';
import { useReportReview } from '../hooks/useReportReview';
import { RejectModal } from './RejectModal';
import { ReportTable } from './ReportTable';
import { ReportToolbar } from './ReportToolbar';

/**
 * 전체 현장보고서 목록과 상태 처리 (SFR-021-08).
 *
 * 무엇을 볼지 고르는 줄과 그 결과를 그리는 표가 같은 목록을 봐야 하므로, 거르는 일만
 * 여기서 한 번 하고 둘에게 나눠 준다. 처리 흐름은 useReportReview 가 따로 쥔다.
 */
export function ReportsBoard() {
  const created = useFieldReportStore((state) => state.created);
  const patched = useFieldReportStore((state) => state.patched);
  const deleted = useFieldReportStore((state) => state.deleted);

  const [keyword, setKeyword] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const review = useReportReview();

  const rows = useMemo(() => {
    const all = mergeFieldReports(created, patched, deleted);
    const trimmed = keyword.trim();

    return all
      .filter((report) => (stateFilter ? report.state === stateFilter : true))
      .filter((report) => (trimmed
        ? report.schoolName.includes(trimmed) || report.inspector.includes(trimmed) || report.id.includes(trimmed)
        : true));
  }, [created, patched, deleted, keyword, stateFilter]);

  const waiting = rows.filter((report) => report.state === 'submitted' || report.state === 'reviewing').length;

  return (
    <>
      <ReportToolbar
        keyword={keyword}
        onKeywordChange={setKeyword}
        state={stateFilter}
        onStateChange={setStateFilter}
        total={rows.length}
        waiting={waiting}
      />

      <ReportTable rows={rows} onManage={review.ask} />

      <ConfirmDialog
        isOpen={review.pending !== null}
        title={review.pending
          ? `${review.pending.report.schoolName} 보고서를 ${REPORT_STATE_LABEL[review.pending.state]}(으)로 처리할까요?`
          : ''}
        description="처리 내역은 보고서 이력에 남습니다."
        confirmLabel="처리"
        onConfirm={review.apply}
        onClose={review.closePending}
      />

      {review.rejecting ? (
        <RejectModal
          report={review.rejecting}
          reason={review.reason}
          onReasonChange={review.setReason}
          onConfirm={review.reject}
          onClose={review.closeReject}
        />
      ) : null}
    </>
  );
}
