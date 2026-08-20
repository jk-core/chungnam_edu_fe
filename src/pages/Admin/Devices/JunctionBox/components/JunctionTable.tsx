import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import type { Column } from '@/components/common/Table';
import styles from '@/pages/Admin/Admin.module.scss';
import type { JunctionRow } from '../hooks/useJunctionRows';

interface JunctionTableProps {
  rows: JunctionRow[];
  onEdit: (box: JunctionRow) => void;
  onDelete: (box: JunctionRow) => void;
}

/** 접속반 목록 (SFR-017-06). 쪽 나눔은 표가 스스로 쥔다. */
export function JunctionTable({ rows, onEdit, onDelete }: JunctionTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [shown, setShown] = useState(rows);

  // 검색 결과가 바뀌면 첫 쪽으로 돌아간다. 3쪽을 보던 중 검색어를 바꾸면 빈 쪽이 남는다.
  if (shown !== rows) {
    setShown(rows);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: Column<JunctionRow>[] = [
    {
      key: 'plant',
      header: '발전소 · 설비',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.plantName}</strong>
          <span className={styles.stackCell__sub}>{row.inverterName}</span>
        </span>
      ),
    },
    {
      key: 'connectBoxId',
      header: '접속반 ID',
      width: '90px',
      hideOnTablet: true,
      render: (row) => <span className={styles.stackCell__sub}>{row.connectBoxId}</span>,
    },
    { key: 'name', header: '접속반', width: '150px', render: (row) => row.name },
    { key: 'series', header: '모듈 직렬', align: 'right', width: '100px', render: (row) => `${row.seriesCount}직렬` },
    { key: 'parallel', header: '모듈 병렬', align: 'right', width: '100px', render: (row) => `${row.parallelCount}병렬` },
    {
      key: 'panels',
      header: '모듈 수',
      align: 'right',
      width: '100px',
      hideOnTablet: true,
      render: (row) => `${formatNumber(row.seriesCount * row.parallelCount)}장`,
    },
    {
      key: 'action',
      header: '관리',
      width: '140px',
      align: 'center',
      render: (row) => (
        <span className={styles.toolbar__actions}>
          <Button size="sm" variant="secondary" onClick={() => onEdit(row)}>수정</Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(row)}>삭제</Button>
        </span>
      ),
    },
  ];

  return (
    <Reveal delay={0.05}>
      <Card
        title="접속반 목록"
        description="접속반 한 면이 받는 직렬·병렬 수를 적습니다. 스트링 구성과 어긋나면 진단 기대값이 흔들립니다."
      >
        {rows.length === 0 ? (
          <EmptyState title="조건에 맞는 접속반이 없습니다" description="검색어를 지우거나 새 접속반을 등록해 보세요." />
        ) : (
          <>
            <Table
              caption="접속반 목록. 발전소와 설비, 접속반 이름, 모듈 직렬·병렬, 모듈 수 순입니다."
              columns={columns}
              rows={pageRows}
              getRowKey={(row) => row.id}
            />
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              totalCount={rows.length}
              onChange={setPage}
              label="접속반 목록"
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </>
        )}
      </Card>
    </Reveal>
  );
}
