import { useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { REPORT_STATE_LABEL } from '@/mocks/fieldReport';
import { ReportStateActions } from '@/components/report/ReportStateActions';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { useTemplates } from '@/stores/fieldReportStore';
import styles from '@/pages/Admin/Admin.module.scss';
import type { Column } from '@/components/common/Table';
import type { FieldReport, ReportState } from '@/interface/fieldReport';
import { STATE_TONE } from './reportState';

interface ReportTableProps {
  rows: FieldReport[];
  onManage: (report: FieldReport, state: ReportState) => void;
}

/** 걸러 낸 보고서 목록. 쪽 나눔은 표가 스스로 쥔다. */
export function ReportTable({ rows, onManage }: ReportTableProps) {
  const templates = useTemplates();
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
      // 아직 내지 않은 보고서는 검토할 것이 없다.
      render: (row) => (row.state === 'draft' ? null : (
        <span className={styles.toolbar__actions}>
          <ReportStateActions report={row} size="sm" onSelect={onManage} />
        </span>
      )),
    },
  ];

  return (
    <Reveal>
      <Card
        title="현장보고서 전체 목록"
        description="제출된 보고서에 검토·반려·확인을 매깁니다. 순서를 밟지 않고 곧바로 고르며, 처리 내역은 보고서 이력에 남습니다."
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
