import { useNavigate } from 'react-router-dom';
import { editPath } from '@/pages/Admin/_shared/adminPath';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import type { Column } from '@/components/common/Table';
import type { ManageRtuEnterprisePage } from '@/service/rtuEnterprise/type';
import styles from '@/pages/Admin/Admin.module.scss';
import type { useRtuEnterpriseList } from '../hooks/useRtuEnterpriseList';

/**
 * RTU 업체 목록 (SFR-016-01).
 * 쪽 나눔은 서버가 한다 — 표는 지금 쪽을 그리기만 하고 조건은 조회 훅이 쥔다.
 */
export function RtuEnterpriseTable({ list }: { list: ReturnType<typeof useRtuEnterpriseList> }) {
  const navigate = useNavigate();

  const columns: Column<ManageRtuEnterprisePage>[] = [
    {
      key: 'rtuEnterpriseId',
      header: 'RTU업체 ID',
      width: '100px',
      hideOnTablet: true,
      render: (row) => <span className={styles.stackCell__sub}>{row.rtuEnterpriseId}</span>,
    },
    {
      key: 'rtuEnterpriseName',
      header: '업체명',
      render: (row) => <strong>{row.rtuEnterpriseName}</strong>,
    },
    {
      key: 'rtuEnterpriseEmail',
      header: '이메일',
      width: '240px',
      hideOnTablet: true,
      render: (row) => row.rtuEnterpriseEmail || '-',
    },
    {
      key: 'rtuEnterprisePhone',
      header: '전화번호',
      width: '150px',
      render: (row) => row.rtuEnterprisePhone || '-',
    },
  ];

  return (
    <Reveal delay={0.05}>
      <Card
        title="RTU업체 목록"
        description="발전소 등록에서 고르는 업체 목록입니다. 장애가 났을 때 연락할 곳이라 연락처를 채워 주세요."
      >
        {list.rows.length === 0 ? (
          <EmptyState title="조건에 맞는 업체가 없습니다" description="검색어를 지우거나 새 업체를 등록해 보세요." />
        ) : (
          <>
            <Table
              caption="RTU업체 목록. ID, 업체명, 이메일, 전화번호 순입니다."
              columns={columns}
              rows={list.rows}
              getRowKey={(row) => String(row.rtuEnterpriseId)}
              onRowClick={(row) => navigate(editPath('plants', 'rtu-enterprise', 'rtuEnterpriseId', row.rtuEnterpriseId))}
            />
            <Pagination
              page={list.param.page + 1}
              pageCount={list.pageCount}
              totalCount={list.totalCount}
              onChange={(page) => list.setParam((prev) => ({ ...prev, page: page - 1 }))}
              label="RTU업체 목록"
              pageSize={list.param.size}
              onPageSizeChange={(size) => list.setParam((prev) => ({ ...prev, size, page: 0 }))}
            />
          </>
        )}
      </Card>
    </Reveal>
  );
}
