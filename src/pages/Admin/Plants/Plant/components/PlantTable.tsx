import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { editPath } from '@/pages/Admin/_shared/adminPath';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { formatCapacity } from '@/utils/format';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import type { Column } from '@/components/common/Table';
import type { School } from '@/interface/energy';
import styles from '@/pages/Admin/Admin.module.scss';
import { useManagedUsers } from '@/pages/Admin/Plants/Equipment/hooks/useEquipmentPickers';
import { useAssetOf, usePlantCapacity } from '../hooks/usePlantData';

interface PlantTableProps {
  rows: School[];
  onDelete: (plant: School) => void;
}

/** 발전소 목록 (SFR-016). 쪽 나눔은 표가 스스로 쥔다. */
export function PlantTable({ rows, onDelete }: PlantTableProps) {
  const assetOf = useAssetOf();
  const capacityOf = usePlantCapacity();
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
      header: '소유자',
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
      key: 'capacity',
      header: '발전용량',
      align: 'right',
      width: '110px',
      render: (row) => {
        const capacity = formatCapacity(capacityOf(row.id));

        return `${capacity.value} ${capacity.unit}`;
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
    {
      key: 'action',
      header: '관리',
      width: '140px',
      align: 'center',
      render: (row) => (
        <span className={styles.toolbar__actions}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(editPath('plants', 'plant', 'powerPlantId', assetOf(row.id)?.powerPlantId ?? 0))}
          >
            수정
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(row)}>삭제</Button>
        </span>
      ),
    },
  ];

  return (
    <Reveal>
      <Card
        title="발전소 목록"
        description="위 등록 버튼으로 발전소를 새로 세우고, 행의 수정 버튼으로 등록 정보를 고칩니다. 변경 내역은 아래 이력에 남습니다."
      >
        <Table
          caption="발전소 등록 목록. ID, 발전소 이름, 소유자, 주소, 발전용량, 상태 순입니다."
          columns={columns}
          rows={pageRows}
          getRowKey={(row) => row.id}
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
