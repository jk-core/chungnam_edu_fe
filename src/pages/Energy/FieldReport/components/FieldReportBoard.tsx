import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { cn } from '@/utils/cn';
import { EmptyState } from '@/components/common/EmptyState';
import { PlusIcon } from '@/components/common/Icon';
import type { FieldReport, ReportState } from '@/interface/fieldReport';
import styles from '../FieldReport.module.scss';
import { useFieldReports } from '../hooks/useFieldReports';
import { useReportWorkflow } from '../hooks/useReportWorkflow';
import { ReportEditor } from './editor/ReportEditor';
import { DueNotice } from './DueNotice';
import { FieldCompareModal } from './FieldCompareModal';
import { InspectionSchedule } from './InspectionSchedule';
import { RejectModal } from './RejectModal';
import { RepeatNotice } from './RepeatNotice';
import { ReportDetail } from './ReportDetail';
import { ReportList } from './ReportList';

/** 작성판을 어떤 뜻으로 열었는지 — 새로 쓰는 것이면 origin 이 null 이다 */
interface WriteIntent {
  origin: FieldReport | null;
}

/**
 * 현장 보고서 온라인 작성·관리 (SFR-021).
 * 목록·상세·작성이 같은 한 벌을 보므로 무엇을 열어 두었는지만 여기서 쥔다.
 */
export function FieldReportBoard() {
  const { plant, label, reports, repeats, dueTemplates } = useFieldReports();
  const workflow = useReportWorkflow();

  const [openId, setOpenId] = useState<string | null>(null);
  const [writing, setWriting] = useState<WriteIntent | null>(null);
  const [rejecting, setRejecting] = useState<FieldReport | null>(null);
  // 나란히 비교할 두 건 (SFR-021-12)
  const [picked, setPicked] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  const detail = reports.find((item) => item.id === openId) ?? null;
  const pickedReports = picked
    .map((id) => reports.find((item) => item.id === id))
    .filter((item): item is FieldReport => item !== undefined);

  /** 목록에서 비교할 두 건을 고른다 — 셋째를 누르면 가장 먼저 고른 것을 놓는다. */
  const togglePick = (id: string) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id].slice(-2)));
  };

  /** 되돌아온(또는 작성중인) 보고서를 그대로 열어 고친다 (SFR-021-09) */
  const startEditing = (report: FieldReport) => {
    setOpenId(null);
    setWriting({ origin: report });
  };

  const reject = (reason: string) => {
    if (!rejecting) return;

    workflow.reject(rejecting, reason);
    setRejecting(null);
  };

  /** 반려만 사유를 받아야 해서 창을 연다 — 나머지는 고른 그대로 매긴다 */
  const manage = (report: FieldReport, state: ReportState) => {
    if (state === 'rejected') {
      setRejecting(report);

      return;
    }

    workflow.setState(report, state);
  };

  return (
    <div className={styles.tab}>
      <div className={cn(styles.toolbar, 'no-print')}>
        <div className={styles.toolbar__left}>
          <p className={styles.toolbar__note}>
            {label} · 보고서 {reports.length}건
          </p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button variant="secondary" onClick={() => setIsComparing(true)} disabled={pickedReports.length < 2}>
            선택한 2건 비교{picked.length > 0 ? ` (${picked.length}/2)` : ''}
          </Button>
          <Button iconLeft={<PlusIcon />} onClick={() => setWriting({ origin: null })} disabled={!plant}>
            보고서 작성
          </Button>
        </div>
      </div>

      {!plant ? (
        <Card padding="none">
          <EmptyState
            title="발전소를 먼저 고르세요"
            description="현장보고서는 발전소 한 곳을 기준으로 작성합니다. 좌측 조회 대상에서 학교를 골라 주세요."
          />
        </Card>
      ) : null}

      <DueNotice templates={dueTemplates} reports={reports} />

      <RepeatNotice issues={repeats} />

      <ReportList reports={reports} picked={picked} onTogglePick={togglePick} onOpen={setOpenId} />

      {detail ? (
        <ReportDetail
          report={detail}
          onClose={() => setOpenId(null)}
          onEdit={startEditing}
          onManage={manage}
        />
      ) : null}

      {/* 고쳐 쓰는 보고서가 바뀌면 작성판을 새로 세워, 앞서 적던 내용이 남지 않게 한다. */}
      {writing ? (
        <ReportEditor
          key={writing.origin?.id ?? 'new'}
          origin={writing.origin}
          onClose={() => setWriting(null)}
        />
      ) : null}

      {rejecting ? (
        <RejectModal report={rejecting} onConfirm={reject} onClose={() => setRejecting(null)} />
      ) : null}

      <FieldCompareModal
        isOpen={isComparing && pickedReports.length === 2}
        reports={pickedReports}
        onClose={() => setIsComparing(false)}
      />

      {/* 점검 일정은 현장 점검과 한 흐름이라 보고서 아래 붙여 둔다 (SFR-021-19). */}
      <InspectionSchedule reports={reports} />
    </div>
  );
}
