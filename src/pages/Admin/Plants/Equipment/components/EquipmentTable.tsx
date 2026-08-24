import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { editPath } from '@/pages/Admin/_shared/adminPath';
import { Card } from '@/components/common/Card';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { INVERTER_KIND_LABEL } from '@/mocks/deviceMaster';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import type { Column } from '@/components/common/Table';
import styles from '@/pages/Admin/Admin.module.scss';
import type { EquipmentRow } from '../hooks/useEquipmentRows';

/** 설비 목록 (SFR-017-04). 쪽 나눔은 표가 스스로 쥔다. */
export function EquipmentTable({ rows }: { rows: EquipmentRow[] }) {
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
          <span className={styles.stackCell__sub}>{row.name}</span>
        </span>
      ),
    },
    {
      key: 'inverter',
      header: '인버터 모델',
      width: '190px',
      render: (row) => (
        <span className={styles.stackCell}>
          <span>{row.inverterName}</span>
          <span className={styles.stackCell__sub}>
            {row.inverterMaker}
            {row.inverterKind ? ` · ${INVERTER_KIND_LABEL[row.inverterKind]}` : ''}
          </span>
        </span>
      ),
    },
    {
      key: 'capacity',
      header: '설비용량',
      align: 'right',
      width: '100px',
      render: (row) => `${formatNumber(row.equipmentCapacity, 1)}kW`,
    },
    {
      key: 'rtu',
      header: 'RTU 통신 ID · 포트',
      width: '160px',
      hideOnTablet: true,
      render: (row) => `${row.rtuCommId || '—'} · ${row.rtuPort ?? '—'}번`,
    },
  ];

  return (
    <Reveal delay={0.05}>
      <Card title="설비 목록" description="등록 정보를 고치면 설비용량은 모듈 구성에서 다시 계산합니다.">
        {rows.length === 0 ? (
          <EmptyState title="조건에 맞는 설비가 없습니다" description="검색어를 지우거나 새 설비를 등록해 보세요." />
        ) : (
          <>
            <Table
              caption="설비 목록. CID, 발전소와 설비, 인버터 모델, 산출 용량, RTU 통신 설정 순입니다."
              columns={columns}
              rows={pageRows}
              getRowKey={(row) => row.inverterId}
              onRowClick={(row) => navigate(editPath('plants', 'equipment', 'cid', row.cid))}
            />
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              totalCount={rows.length}
              onChange={setPage}
              label="설비 목록"
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
