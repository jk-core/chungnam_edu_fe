import { useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { Reveal } from '@/components/common/Reveal';
import { RTU_LABEL, RTU_TONE } from '@/mocks/status';
import { Table } from '@/components/common/Table';
import type { Column } from '@/components/common/Table';
import type { Rtu } from '@/interface/asset';
import styles from '@/pages/Admin/Admin.module.scss';

interface RtuTableProps {
  rows: Rtu[];
  onOpenEvents: (rtu: Rtu) => void;
  onEdit: (rtu: Rtu) => void;
  onDelete: (rtu: Rtu) => void;
}

/** RTU 목록 (SFR-017-01). 쪽 나눔은 표가 스스로 쥔다. */
export function RtuTable({ rows, onOpenEvents, onEdit, onDelete }: RtuTableProps) {
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

  const columns: Column<Rtu>[] = [
    {
      key: 'plant',
      header: '발전소',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.plantName}</strong>
          <span className={styles.stackCell__sub}>{row.model} · {row.serial}</span>
        </span>
      ),
    },
    { key: 'firmware', header: '펌웨어', width: '90px', hideOnTablet: true, render: (row) => `v${row.firmware}` },
    { key: 'interval', header: '수집 주기', align: 'right', width: '90px', render: (row) => `${row.intervalMinutes}분` },
    {
      key: 'status',
      header: '연계 상태',
      width: '110px',
      render: (row) => (
        <Badge tone={RTU_TONE[row.status]} withDot>
          {RTU_LABEL[row.status]}
        </Badge>
      ),
    },
    { key: 'seen', header: '최근 수신', width: '150px', hideOnTablet: true, render: (row) => row.lastSeenAt },
    {
      key: 'action',
      header: '관리',
      width: '200px',
      align: 'center',
      render: (row) => (
        <span className={styles.toolbar__actions}>
          <Button size="sm" variant="secondary" onClick={() => onOpenEvents(row)}>이력</Button>
          <Button size="sm" variant="secondary" onClick={() => onEdit(row)}>수정</Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(row)}>삭제</Button>
        </span>
      ),
    },
  ];

  return (
    <Reveal delay={0.05}>
      <Card title="RTU 목록" description="연계 상태와 수집 주기를 확인하고, 이력 버튼으로 교체·이설 내역을 봅니다.">
        {rows.length === 0 ? (
          <EmptyState title="조건에 맞는 RTU가 없습니다" description="검색어를 지우거나 새 장치를 등록해 보세요." />
        ) : (
          <>
            <Table
              caption="RTU 목록. 발전소와 모델·시리얼, 펌웨어, 수집 주기, 연계 상태, 최근 수신 순입니다."
              columns={columns}
              rows={pageRows}
              getRowKey={(row) => row.id}
              getRowClassName={(row) => (row.status === 'disconnected' ? styles.rowAlert : undefined)}
            />
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              totalCount={rows.length}
              onChange={setPage}
              label="RTU 목록"
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
