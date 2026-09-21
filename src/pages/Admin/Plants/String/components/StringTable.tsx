import { useNavigate } from 'react-router-dom';
import { editPath } from '@/pages/Admin/_shared/adminPath';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import type { Column } from '@/components/common/Table';
import type { ManageStringPage } from '@/service/string/type';
import styles from '@/pages/Admin/Admin.module.scss';
import type { useStringList } from '../hooks/useStringList';

/** 설비별 스트링 목록 (SFR-016-01). 쪽 나눔은 서버가 한다. */
export function StringTable({ list }: { list: ReturnType<typeof useStringList> }) {
  const navigate = useNavigate();

  const columns: Column<ManageStringPage>[] = [
    {
      key: 'cid',
      header: 'CID',
      width: '120px',
      hideOnTablet: true,
      render: (row) => <span className={styles.stackCell__sub}>{row.cid}</span>,
    },
    {
      key: 'powerPlantName',
      header: '발전소 · 설비',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.powerPlantName}</strong>
          <span className={styles.stackCell__sub}>{row.equipmentName}</span>
        </span>
      ),
    },
    {
      key: 'stringCount',
      header: '스트링 갯수',
      align: 'right',
      width: '110px',
      render: (row) => `${formatNumber(row.stringCount)}조`,
    },
    {
      key: 'moduleCount',
      header: '모듈 수',
      align: 'right',
      width: '100px',
      hideOnTablet: true,
      render: (row) => `${formatNumber(row.moduleCount)}장`,
    },
  ];

  return (
    <Reveal delay={0.05}>
      <Card
        title="스트링 목록"
        description="한 줄이 스트링 인버터 한 대입니다. 줄을 누르면 그 설비의 스트링을 한 판에서 함께 고칩니다."
      >
        {list.rows.length === 0 ? (
          <EmptyState title="조건에 맞는 설비가 없습니다" description="검색어를 지우거나 설비 탭에서 먼저 등록해 보세요." />
        ) : (
          <>
            <Table
              caption="설비별 스트링 목록. CID, 발전소와 설비, 스트링 갯수, 모듈 수 순입니다."
              columns={columns}
              rows={list.rows}
              getRowKey={(row) => String(row.cid)}
              onRowClick={(row) => navigate(editPath('plants', 'string', 'cid', row.cid))}
            />
            <Pagination
              page={list.param.page + 1}
              pageCount={list.pageCount}
              totalCount={list.totalCount}
              onChange={(page) => list.setParam((prev) => ({ ...prev, page: page - 1 }))}
              label="스트링 목록"
              pageSize={list.param.size}
              onPageSizeChange={(size) => list.setParam((prev) => ({ ...prev, size, page: 0 }))}
            />
          </>
        )}
      </Card>
    </Reveal>
  );
}
