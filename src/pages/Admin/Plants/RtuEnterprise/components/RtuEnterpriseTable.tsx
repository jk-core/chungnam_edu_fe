import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { editPath } from '@/pages/Admin/_shared/adminPath';
import { Card } from '@/components/common/Card';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import type { Column } from '@/components/common/Table';
import type { RtuEnterprise } from '@/interface/deviceMaster';
import styles from '@/pages/Admin/Admin.module.scss';

/** RTU 업체 목록 (SFR-016-01). 쪽 나눔은 표가 스스로 쥔다. */
export function RtuEnterpriseTable({ rows }: { rows: RtuEnterprise[] }) {
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

  const columns: Column<RtuEnterprise>[] = [
    {
      key: 'rtuEnterpriseId',
      header: 'RTU업체 ID',
      width: '100px',
      hideOnTablet: true,
      render: (row) => <span className={styles.stackCell__sub}>{row.rtuEnterpriseId}</span>,
    },
    {
      key: 'name',
      header: '업체명',
      render: (row) => <strong>{row.name}</strong>,
    },
    {
      key: 'email',
      header: '이메일',
      width: '240px',
      hideOnTablet: true,
      render: (row) => row.email || '-',
    },
    {
      key: 'phone',
      header: '전화번호',
      width: '150px',
      render: (row) => row.phone || '-',
    },
  ];

  return (
    <Reveal delay={0.05}>
      <Card
        title="RTU업체 목록"
        description="발전소 등록에서 고르는 업체 목록입니다. 장애가 났을 때 연락할 곳이라 연락처를 채워 주세요."
      >
        {rows.length === 0 ? (
          <EmptyState title="조건에 맞는 업체가 없습니다" description="검색어를 지우거나 새 업체를 등록해 보세요." />
        ) : (
          <>
            <Table
              caption="RTU업체 목록. ID, 업체명, 이메일, 전화번호 순입니다."
              columns={columns}
              rows={pageRows}
              getRowKey={(row) => row.id}
              onRowClick={(row) => navigate(editPath('plants', 'rtu-enterprise', 'rtuEnterpriseId', row.rtuEnterpriseId))}
            />
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              totalCount={rows.length}
              onChange={setPage}
              label="RTU업체 목록"
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
