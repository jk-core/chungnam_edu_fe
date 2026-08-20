import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { REPORT_STATE_LABEL } from '@/mocks/fieldReport';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import useFieldReportStore, { mergeTemplates } from '@/stores/fieldReportStore';
import styles from '@/pages/Admin/Admin.module.scss';
import type { Column } from '@/components/common/Table';
import type { FieldReport } from '@/interface/fieldReport';
import { canReject, nextStateOf, STATE_TONE } from './reportState';

interface ReportTableProps {
  rows: FieldReport[];
  onAdvance: (report: FieldReport) => void;
  onReject: (report: FieldReport) => void;
}

/** 걸러 낸 보고서 목록. 쪽 나눔은 표가 스스로 쥔다. */
export function ReportTable({ rows, onAdvance, onReject }: ReportTableProps) {
  const templatePatched = useFieldReportStore((state) => state.templatePatched);
  const templates = useMemo(() => mergeTemplates(templatePatched), [templatePatched]);
  const templateLabelOf = (id: string) => templates.find((item) => item.id === id)?.label ?? id;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [shown, setShown] = useState(rows);

  // 걸러 낸 결과가 바뀌면 첫 쪽으로 돌아간다. 3쪽을 보던 중 검색어를 바꾸면 빈 쪽이 남는다.
  if (shown !== rows) {
    setShown(rows);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
        const next = nextStateOf(row.state);

        return (
          <span className={styles.toolbar__actions}>
            {next ? (
              <Button size="sm" variant="secondary" onClick={() => onAdvance(row)}>
                {REPORT_STATE_LABEL[next]}
              </Button>
            ) : null}
            {canReject(row.state) ? (
              <Button size="sm" variant="ghost" onClick={() => onReject(row)}>반려</Button>
            ) : null}
          </span>
        );
      },
    },
  ];

  return (
    <Reveal>
      <Card
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
  );
}
