import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { editPath } from '@/pages/Admin/_shared/adminPath';
import { EmptyState } from '@/components/common/EmptyState';
import { formatNumber } from '@/utils/format';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import type { Column } from '@/components/common/Table';
import type { ManagedUser } from '@/interface/account';
import styles from '@/pages/Admin/Admin.module.scss';

/** 그룹관리자 목록 (SFR-018). 쪽 나눔은 표가 스스로 쥔다. */
export function GroupTable({ rows }: { rows: ManagedUser[] }) {
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

  const columns: Column<ManagedUser>[] = [
    {
      key: 'userId',
      header: 'ID',
      width: '80px',
      render: (row) => <span className={styles.stackCell__sub}>{row.userId}</span>,
    },
    {
      key: 'name',
      header: '그룹관리자',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.name}</strong>
          <span className={styles.stackCell__sub}>{row.loginId}</span>
        </span>
      ),
    },
    { key: 'email', header: '이메일', width: '200px', hideOnTablet: true, render: (row) => row.email },
    {
      key: 'plants',
      header: '맡은 발전소',
      align: 'right',
      width: '110px',
      render: (row) => `${formatNumber(row.plantIds.length)}곳`,
    },
  ];

  return (
    <Reveal delay={0.05}>
      <Card
        title="그룹관리자 목록"
        description="한 사람이 맡은 발전소를 여기서 더하고 뺍니다. 계정 자체는 사용자 탭에서 다룹니다."
      >
        {rows.length === 0 ? (
          <EmptyState title="조건에 맞는 그룹관리자가 없습니다" description="검색어를 지우거나 새로 등록해 보세요." />
        ) : (
          <>
            <Table
              caption="그룹관리자 목록. ID, 이름, 이메일, 맡은 발전소 수 순입니다."
              columns={columns}
              rows={pageRows}
              getRowKey={(row) => row.id}
              onRowClick={(row) => navigate(editPath('users', 'group', 'userId', row.userId))}
            />
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              totalCount={rows.length}
              onChange={setPage}
              label="그룹관리자 목록"
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
