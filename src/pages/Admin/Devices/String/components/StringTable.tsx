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
import type { EquipmentRow } from '../hooks/useStringData';

interface StringTableProps {
  rows: EquipmentRow[];
  onEdit: (row: EquipmentRow) => void;
  onClear: (row: EquipmentRow) => void;
}

/** 설비별 스트링 목록 (SFR-016-01). 쪽 나눔은 표가 스스로 쥔다. */
export function StringTable({ rows, onEdit, onClear }: StringTableProps) {
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

  const columns: Column<EquipmentRow>[] = [
    {
      key: 'cid',
      header: 'CID',
      width: '120px',
      hideOnTablet: true,
      render: (row) => <span className={styles.stackCell__sub}>{row.cid}</span>,
    },
    {
      key: 'plant',
      header: '발전소 · 설비',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.plantName}</strong>
          <span className={styles.stackCell__sub}>{row.equipmentName}</span>
        </span>
      ),
    },
    {
      key: 'count',
      header: '스트링 갯수',
      align: 'right',
      width: '110px',
      render: (row) => `${formatNumber(row.stringCount)}조`,
    },
    {
      key: 'panels',
      header: '모듈 수',
      align: 'right',
      width: '100px',
      hideOnTablet: true,
      render: (row) => `${formatNumber(row.panelCount)}장`,
    },
    {
      key: 'action',
      header: '관리',
      width: '160px',
      align: 'center',
      render: (row) => (
        <span className={styles.toolbar__actions}>
          <Button size="sm" variant="secondary" onClick={() => onEdit(row)}>
            {row.stringCount > 0 ? '스트링 편집' : '스트링 등록'}
          </Button>
          <Button size="sm" variant="ghost" disabled={row.stringCount === 0} onClick={() => onClear(row)}>
            전체 삭제
          </Button>
        </span>
      ),
    },
  ];

  return (
    <Reveal delay={0.05}>
      <Card
        title="스트링 목록"
        description="설비별로 묶어 순번대로 보여 줍니다. 수정을 누르면 그 설비의 스트링을 한 판에서 함께 고칩니다."
      >
        {rows.length === 0 ? (
          <EmptyState title="조건에 맞는 스트링이 없습니다" description="검색어를 지우거나 새 스트링을 등록해 보세요." />
        ) : (
          <>
            <Table
              caption="설비별 스트링 목록. CID, 발전소와 설비, 스트링 갯수, 모듈 수 순입니다."
              columns={columns}
              rows={pageRows}
              getRowKey={(row) => row.inverterId}
            />
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              totalCount={rows.length}
              onChange={setPage}
              label="스트링 목록"
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
