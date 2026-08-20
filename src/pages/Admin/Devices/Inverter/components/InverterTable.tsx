import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { INVERTER_KIND_LABEL } from '@/mocks/deviceMaster';
import { INVERTER_PHASE_LABEL } from '@/mocks/equipment';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import type { Column } from '@/components/common/Table';
import styles from '@/pages/Admin/Admin.module.scss';
import type { InverterRow } from '../hooks/useInverterRows';

interface InverterTableProps {
  rows: InverterRow[];
  onEdit: (row: InverterRow) => void;
  onDelete: (row: InverterRow) => void;
}

/** 인버터 목록 (SFR-017-04). 쪽 나눔은 표가 스스로 쥔다. */
export function InverterTable({ rows, onEdit, onDelete }: InverterTableProps) {
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

  const columns: Column<InverterRow>[] = [
    {
      key: 'cid',
      header: 'CID',
      width: '120px',
      hideOnTablet: true,
      render: (row) => <span className={styles.stackCell__sub}>{row.cid}</span>,
    },
    {
      key: 'plant',
      header: '발전소 · 인버터',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.plantName}</strong>
          <span className={styles.stackCell__sub}>{row.name} · {row.maker}</span>
        </span>
      ),
    },
    { key: 'kind', header: '유형', width: '100px', render: (row) => INVERTER_KIND_LABEL[row.kind] },
    {
      key: 'phase',
      header: '위상',
      width: '110px',
      hideOnTablet: true,
      render: (row) => INVERTER_PHASE_LABEL[row.phase],
    },
    {
      key: 'capacity',
      header: '설비용량',
      align: 'right',
      width: '100px',
      render: (row) => `${formatNumber(row.equipmentCapacity, 1)}kW`,
    },
    {
      key: 'units',
      header: '모듈 구성',
      width: '170px',
      hideOnTablet: true,
      render: (row) => (
        <span className={styles.stackCell}>
          <span>{row.series1}직렬 × {row.parallel1}병렬</span>
          <span className={styles.stackCell__sub}>{row.moduleName}</span>
        </span>
      ),
    },
    {
      key: 'rtu',
      header: 'RTU 통신 ID · 포트',
      width: '160px',
      hideOnTablet: true,
      render: (row) => `${row.rtuCommId} · ${row.rtuPort ?? '—'}번`,
    },
    {
      key: 'action',
      header: '관리',
      width: '140px',
      align: 'center',
      render: (row) => (
        <span className={styles.toolbar__actions}>
          <Button size="sm" variant="secondary" onClick={() => onEdit(row)}>수정</Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(row)}>삭제</Button>
        </span>
      ),
    },
  ];

  return (
    <Reveal delay={0.05}>
      <Card title="인버터 목록" description="등록 정보를 고치면 설비용량은 모듈 구성에서 다시 계산합니다.">
        {rows.length === 0 ? (
          <EmptyState title="조건에 맞는 인버터가 없습니다" description="검색어를 지우거나 새 설비를 등록해 보세요." />
        ) : (
          <>
            <Table
              caption="인버터 목록. 발전소와 인버터, 유형, 위상, 산출 용량, 모듈 구성, RTU 통신 설정 순입니다."
              columns={columns}
              rows={pageRows}
              getRowKey={(row) => row.inverterId}
            />
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              totalCount={rows.length}
              onChange={setPage}
              label="인버터 목록"
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
