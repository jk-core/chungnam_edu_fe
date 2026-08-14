import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Modal } from '@/components/common/Modal';
import { NOW } from '@/mocks/today';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { REPORT_STATE_LABEL, STATE_ORDER } from '@/mocks/fieldReport';
import { Reveal } from '@/components/common/Reveal';
import { Select } from '@/components/common/Select';
import { Table } from '@/components/common/Table';
import { TextArea, TextField } from '@/components/common/Form';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useFieldReportStore, { mergeFieldReports, mergeTemplates } from '@/stores/fieldReportStore';
import type { BadgeTone } from '@/components/common/Badge';
import type { Column } from '@/components/common/Table';
import type { FieldReport, ReportState } from '@/interface/fieldReport';
import styles from '../../Admin.module.scss';

const STATE_TONE: Record<ReportState, BadgeTone> = {
  draft: 'neutral',
  submitted: 'brand',
  reviewing: 'caution',
  confirmed: 'ok',
  rejected: 'critical',
};

/** 상태 필터 — 전체를 앞에 세운다 */
const STATE_FILTER: { value: string; label: string }[] = [
  { value: '', label: '전체 상태' },
  ...[...STATE_ORDER, 'rejected' as ReportState].map((state) => ({
    value: state,
    label: REPORT_STATE_LABEL[state],
  })),
];

/**
 * 전체 현장보고서 목록·상태 관리 (SFR-021-08).
 * 발전관리 쪽 화면은 학교 하나만 보지만, 여기서는 도 전체를 한 표에서 훑고 상태를 정리한다.
 */
function ReportsDepth() {
  const created = useFieldReportStore((state) => state.created);
  const patched = useFieldReportStore((state) => state.patched);
  const deleted = useFieldReportStore((state) => state.deleted);
  const templatePatched = useFieldReportStore((state) => state.templatePatched);
  const patch = useFieldReportStore((state) => state.patch);
  const actor = useAuthUser();

  const [keyword, setKeyword] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [rejecting, setRejecting] = useState<FieldReport | null>(null);
  const [reason, setReason] = useState('');
  const [advancing, setAdvancing] = useState<FieldReport | null>(null);

  const templates = useMemo(() => mergeTemplates(templatePatched), [templatePatched]);
  const templateLabelOf = (id: string) => templates.find((item) => item.id === id)?.label ?? id;

  const rows = useMemo(() => {
    const all = mergeFieldReports(created, patched, deleted);
    const trimmed = keyword.trim();

    return all
      .filter((report) => (stateFilter ? report.state === stateFilter : true))
      .filter((report) => (trimmed
        ? report.schoolName.includes(trimmed) || report.inspector.includes(trimmed) || report.id.includes(trimmed)
        : true));
  }, [created, patched, deleted, keyword, stateFilter]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const waiting = rows.filter((report) => report.state === 'submitted' || report.state === 'reviewing').length;

  /** 이력 한 줄을 붙여 상태를 옮긴다 — 진행·반려가 같은 형식을 쓴다. */
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
    if (!advancing) return;

    const index = STATE_ORDER.indexOf(advancing.state);

    if (index < 0 || index >= STATE_ORDER.length - 1) return;

    const next = STATE_ORDER[index + 1];

    move(advancing, next, `${REPORT_STATE_LABEL[next]}(으)로 바꿨습니다.`);
    toast.success(`${advancing.schoolName} 보고서를 ${REPORT_STATE_LABEL[next]}(으)로 처리했습니다.`);
    setAdvancing(null);
  };

  const reject = () => {
    if (!rejecting || !reason.trim()) return;

    move(rejecting, 'rejected', `반려했습니다. — ${reason.trim()}`, { rejectReason: reason.trim() });
    toast.success(`${rejecting.schoolName} 보고서를 반려했습니다.`);
    setRejecting(null);
    setReason('');
  };

  const columns: Column<FieldReport>[] = [
    {
      key: 'id',
      header: '보고서 번호',
      width: '110px',
      render: (row) => <span className={styles.stackCell__sub}>{row.id}</span>,
    },
    {
      key: 'school',
      header: '발전소 · 양식',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.schoolName}</strong>
          <span className={styles.stackCell__sub}>
            {templateLabelOf(row.templateId)} v{row.templateVersion} · {row.inspectType}점검
          </span>
        </span>
      ),
    },
    { key: 'date', header: '점검일', width: '110px', render: (row) => row.date },
    { key: 'inspector', header: '점검자', width: '100px', hideOnTablet: true, render: (row) => row.inspector },
    {
      key: 'abnormal',
      header: '이상',
      width: '70px',
      align: 'right',
      hideOnTablet: true,
      render: (row) => `${row.checklist.filter((item) => item.result === 'abnormal').length}건`,
    },
    {
      key: 'state',
      header: '상태',
      width: '110px',
      render: (row) => (
        <Badge tone={STATE_TONE[row.state]} withDot>
          {REPORT_STATE_LABEL[row.state]}
          {row.resubmitCount > 0 ? ` · 재기안 ${row.resubmitCount}` : ''}
        </Badge>
      ),
    },
    {
      key: 'action',
      header: '관리',
      width: '190px',
      align: 'center',
      render: (row) => {
        const index = STATE_ORDER.indexOf(row.state);
        const canAdvance = row.state !== 'rejected' && index >= 0 && index < STATE_ORDER.length - 1;
        const canReject = row.state === 'submitted' || row.state === 'reviewing';

        return (
          <span className={styles.toolbar__actions}>
            {canAdvance ? (
              <Button size="sm" variant="secondary" onClick={() => setAdvancing(row)}>
                {REPORT_STATE_LABEL[STATE_ORDER[index + 1]]}
              </Button>
            ) : null}
            {canReject ? (
              <Button size="sm" variant="ghost" onClick={() => setRejecting(row)}>
                반려
              </Button>
            ) : null}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <TextField
            label="이름 검색"
            hideLabel
            value={keyword}
            onChange={(value) => {
              setKeyword(value);
              setPage(1);
            }}
            placeholder="발전소명·점검자·보고서 번호로 검색"
            width="md"
          />
          <Select
            label="상태"
            hideLabel
            value={stateFilter}
            options={STATE_FILTER}
            onChange={(value) => {
              setStateFilter(value);
              setPage(1);
            }}
          />
          <p className={styles.toolbar__note}>
            총 {formatNumber(rows.length)}개{waiting > 0 ? ` · 처리 대기 ${waiting}건` : ''}
          </p>
        </div>
      </div>

      <Reveal>
        <Card
          eyebrow="Field reports"
          title="현장보고서 전체 목록"
          description="제출된 보고서를 검토·확인으로 넘기거나 사유를 적어 반려합니다. 처리 내역은 보고서 이력에 남습니다."
        >
          <Table
            caption="현장보고서 목록"
            columns={columns}
            rows={pageRows}
            getRowKey={(row) => row.id}
            getRowClassName={(row) => (row.state === 'rejected' ? styles.rowAlert : undefined)}
          />
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            totalCount={rows.length}
            onChange={setPage}
            label="현장보고서 목록"
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </Card>
      </Reveal>

      <ConfirmDialog
        isOpen={advancing !== null}
        title={advancing
          ? `${advancing.schoolName} 보고서를 ${REPORT_STATE_LABEL[STATE_ORDER[STATE_ORDER.indexOf(advancing.state) + 1]]}(으)로 처리할까요?`
          : ''}
        description="처리 내역은 보고서 이력에 남습니다."
        confirmLabel="처리"
        onConfirm={advance}
        onClose={() => setAdvancing(null)}
      />

      {/* 반려는 사유가 있어야 한다 — 현장이 무엇을 고쳐야 할지 알아야 다시 낼 수 있다 (SFR-021-08). */}
      <Modal
        isOpen={rejecting !== null}
        onClose={() => setRejecting(null)}
        size="md"
        title="보고서 반려"
        description={rejecting ? `${rejecting.schoolName} · ${rejecting.date} · ${rejecting.inspector}` : undefined}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setRejecting(null)}>
              취소
            </Button>
            <Button onClick={reject} disabled={!reason.trim()}>
              반려
            </Button>
          </>
        )}
      >
        <TextArea
          label="반려 사유"
          value={reason}
          onChange={setReason}
          required
          placeholder="무엇을 고쳐서 다시 내야 하는지 적어 주세요."
          maxLength={300}
        />
      </Modal>
    </>
  );
}

export default ReportsDepth;
