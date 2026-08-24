import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { CELL_TYPE_LABEL } from '@/mocks/moduleProducts';
import { editPath } from '@/pages/Admin/_shared/adminPath';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import type { Column } from '@/components/common/Table';
import type { ModuleProduct } from '@/interface/deviceMaster';
import styles from '@/pages/Admin/Admin.module.scss';

/** 모듈 제품 목록 (SFR-016-01). 쪽 나눔은 표가 스스로 쥔다. */
export function ModuleTable({ rows }: { rows: ModuleProduct[] }) {
  const navigate = useNavigate();
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

  const columns: Column<ModuleProduct>[] = [
    {
      key: 'moduleId',
      header: '모듈 ID',
      width: '90px',
      hideOnTablet: true,
      render: (row) => <span className={styles.stackCell__sub}>{row.moduleId}</span>,
    },
    {
      key: 'name',
      header: '모듈명 · 업체',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.name}</strong>
          <span className={styles.stackCell__sub}>{row.maker}</span>
        </span>
      ),
    },
    { key: 'watt', header: '용량', align: 'right', width: '90px', render: (row) => `${formatNumber(row.wattPerPanel)}W` },
    {
      key: 'cell',
      header: '셀 종류',
      width: '90px',
      align: 'center',
      render: (row) => (
        <Badge tone={row.cellType === 'double' ? 'brand' : 'neutral'}>{CELL_TYPE_LABEL[row.cellType]}</Badge>
      ),
    },
  ];

  return (
    <Reveal delay={0.05}>
      <Card
        title="모듈 제품"
        description="여기에 등록한 제품을 설비 등록에서 고릅니다. 용량은 설비용량 산출에 그대로 쓰입니다."
      >
        {rows.length === 0 ? (
          <EmptyState title="조건에 맞는 제품이 없습니다" description="검색어를 지우거나 새 제품을 등록해 보세요." />
        ) : (
          <>
            <Table
              caption="모듈 제품 목록. ID, 모듈명과 업체, 용량, 셀 종류 순입니다."
              columns={columns}
              rows={pageRows}
              getRowKey={(row) => row.id}
              onRowClick={(row) => navigate(editPath('devices', 'module', 'moduleId', row.moduleId))}
            />
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              totalCount={rows.length}
              onChange={setPage}
              label="모듈 제품 목록"
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
