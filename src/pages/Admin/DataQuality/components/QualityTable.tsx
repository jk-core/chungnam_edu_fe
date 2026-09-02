import { useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { QUALITY_THRESHOLD } from '@/configs/quality';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import type { Column } from '@/components/common/Table';
import type { QualityStatus } from '@/interface/diagnosisDetail';
import styles from '../../Admin.module.scss';

const COLUMNS: Column<QualityStatus>[] = [
  {
    key: 'name',
    header: '발전소',
    render: (row) => (
      <>
        <strong>{row.schoolName}</strong>
        <span className={styles.toolbar__note}> · {row.regionName}</span>
      </>
    ),
  },
  {
    key: 'status',
    header: '설비 상태',
    width: '110px',
    hideOnTablet: true,
    render: (row) => (
      <Badge tone={OPERATION_TONE[row.status]} withDot>
        {OPERATION_LABEL[row.status]}
      </Badge>
    ),
  },
  {
    key: 'rate',
    header: '품질률',
    width: '190px',
    render: (row) => (
      <span className={styles.rate}>
        <span className={styles.rate__track}>
          <span
            className={`${styles.rate__bar} ${row.qualityRate < QUALITY_THRESHOLD ? styles['rate__bar--low'] : ''}`}
            style={{ width: `${Math.round(row.qualityRate * 100)}%` }}
          />
        </span>
        <span className={styles.rate__value}>{(row.qualityRate * 100).toFixed(1)}%</span>
      </span>
    ),
  },
  {
    key: 'rows',
    header: '유효/전체',
    align: 'right',
    width: '150px',
    hideOnTablet: true,
    render: (row) => `${formatNumber(row.validRows)} / ${formatNumber(row.totalRows)}`,
  },
];

/**
 * 발전소별 수집 품질 표 (SFR-012-10).
 *
 * 쪽 번호는 이 표만의 일이라 여기서 쥔다. 조회 기간이 바뀌어 목록이 통째로 달라지면 첫 쪽으로
 * 돌아간다 — 3쪽을 보던 중에 기간을 바꾸면 다른 목록의 3쪽이 나와, 무엇을 보고 있는지 알 수 없다.
 */
export function QualityTable({ rows }: { rows: QualityStatus[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [shownRows, setShownRows] = useState(rows);

  /*
    목록이 통째로 달라지면 첫 쪽으로 돌아간다.

    되돌리는 일을 `useEffect` 로 미루면 다른 목록의 3쪽이 한 번 그려진 뒤에야 첫 쪽으로 튄다.
    렌더 도중에 맞춰 두면 그 한 번이 없다 — 바뀐 것을 알아차린 자리에서 바로 고친다.
    쪽 크기는 사람이 고른 값이라 그대로 둔다.
  */
  if (shownRows !== rows) {
    setShownRows(rows);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Reveal delay={0.08}>
      <Card title="발전소별 품질" description="품질률이 낮은 순입니다. 기준 미달 행은 붉게 표시했습니다.">
        <Table
          caption="발전소별 수집 품질"
          columns={COLUMNS}
          rows={pageRows}
          getRowKey={(row) => row.schoolId}
          getRowClassName={(row) => (row.qualityRate < QUALITY_THRESHOLD ? styles.rowAlert : undefined)}
        />
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          totalCount={rows.length}
          onChange={setPage}
          label="발전소별 품질"
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
