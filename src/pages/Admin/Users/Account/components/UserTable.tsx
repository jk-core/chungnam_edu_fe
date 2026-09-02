import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { editPath } from '@/pages/Admin/_shared/adminPath';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { MaskedText } from '@/components/common/MaskedText';
import { maskEmail } from '@/utils/mask';
import { Reveal } from '@/components/common/Reveal';
import { isReviewRole, ROLE_LABEL } from '@/mocks/accounts';
import { Table } from '@/components/common/Table';
import type { Column } from '@/components/common/Table';
import type { ManagedUser } from '@/interface/account';
import styles from '@/pages/Admin/Admin.module.scss';

/** 사용자 목록 (SFR-018). 잠긴 계정은 줄을 눌러 수정 화면에서 풀어 준다. */
export function UserTable({ rows }: { rows: ManagedUser[] }) {
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
      key: 'name',
      header: '로그인 ID · 이름',
      width: '180px',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>
            {row.name}
            {row.locked ? <Badge tone="critical"> 잠금</Badge> : null}
          </strong>
          <span className={styles.stackCell__sub}>{row.loginId}</span>
        </span>
      ),
    },
    {
      key: 'role',
      header: '등급',
      width: '120px',
      render: (row) => <Badge tone={isReviewRole(row.role) ? 'brand' : 'neutral'}>{ROLE_LABEL[row.role]}</Badge>,
    },
    {
      key: 'email',
      header: '이메일',
      hideOnTablet: true,
      // 목록에서는 가려 두고 필요할 때만 확인한다 (SFR-018-05).
      render: (row) => <MaskedText masked={maskEmail(row.email)} original={row.email} label={`${row.name} 이메일`} />,
    },
    {
      key: 'login',
      header: '마지막 로그인',
      width: '140px',
      hideOnTablet: true,
      render: (row) => row.lastLoginAt ?? '이력 없음',
    },
  ];

  return (
    <Reveal>
      <Card title="사용자" description="줄을 누르면 계정 정보를 고칩니다. 잠긴 계정도 그 화면에서 풀어 줍니다.">
        <Table
          caption="사용자 목록. 로그인 ID와 이름, 등급, 이메일, 마지막 로그인 순입니다."
          columns={columns}
          rows={pageRows}
          getRowKey={(row) => row.id}
          getRowClassName={(row) => (row.locked ? styles.rowAlert : undefined)}
          onRowClick={(row) => navigate(editPath('users', 'account', 'userId', row.userId))}
        />
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          totalCount={rows.length}
          onChange={setPage}
          label="사용자 목록"
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
