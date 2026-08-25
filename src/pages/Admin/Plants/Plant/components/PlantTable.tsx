import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { editPath } from '@/pages/Admin/_shared/adminPath';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { useManagedUsers } from '@/hooks/usePlantAssets';
import type { Column } from '@/components/common/Table';
import type { School } from '@/interface/energy';
import styles from '@/pages/Admin/Admin.module.scss';
import { useAssetOf } from '../hooks/usePlantData';

/** 발전소 목록 (SFR-016). 쪽 나눔은 표가 스스로 쥔다. */
export function PlantTable({ rows }: { rows: School[] }) {
  const assetOf = useAssetOf();
  const users = useManagedUsers();
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

  const columns: Column<School>[] = [
    {
      key: 'plantId',
      header: '발전소 ID',
      width: '100px',
      render: (row) => <span className={styles.stackCell__sub}>{assetOf(row.id)?.powerPlantId ?? '—'}</span>,
    },
    {
      key: 'name',
      header: '발전소 이름',
      render: (row) => (
        <>
          <strong>{assetOf(row.id)?.plantName ?? row.name}</strong>
          <span className={styles.toolbar__note}> · {row.regionName}</span>
        </>
      ),
    },
    {
      key: 'owner',
      header: '사용자',
      width: '110px',
      hideOnTablet: true,
      render: (row) => {
        const userId = assetOf(row.id)?.userId ?? null;

        return (userId === null ? null : users.find((item) => item.userId === userId)?.name) ?? '—';
      },
    },
    {
      key: 'address',
      header: '주소',
      hideOnTablet: true,
      render: (row) => {
        const asset = assetOf(row.id);

        return `${asset?.address ?? row.address} ${asset?.addressDetail ?? ''}`.trim();
      },
    },
    {
      key: 'status',
      header: '상태',
      width: '110px',
      render: (row) => (
        <Badge tone={OPERATION_TONE[row.status]} withDot>
          {OPERATION_LABEL[row.status]}
        </Badge>
      ),
    },
  ];

  return (
    <Reveal>
      <Card
        title="발전소 목록"
        description="위 등록 버튼으로 발전소를 새로 세우고, 행을 누르면 등록 정보를 고칩니다. 변경 내역은 아래 이력에 남습니다."
      >
        <Table
          caption="발전소 등록 목록. ID, 발전소 이름, 사용자, 주소, 상태 순입니다."
          columns={columns}
          rows={pageRows}
          getRowKey={(row) => row.id}
          onRowClick={(row) => navigate(editPath('plants', 'plant', 'powerPlantId', assetOf(row.id)?.powerPlantId ?? 0))}
        />
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          totalCount={rows.length}
          onChange={setPage}
          label="발전소 목록"
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
