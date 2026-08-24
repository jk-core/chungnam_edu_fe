import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { editPath } from '@/pages/Admin/_shared/adminPath';
import { Card } from '@/components/common/Card';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { formatNumber } from '@/utils/format';
import { INVERTER_KIND_LABEL } from '@/mocks/deviceMaster';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import type { Column } from '@/components/common/Table';
import type { InverterProduct } from '@/interface/deviceMaster';
import styles from '@/pages/Admin/Admin.module.scss';

/** 인버터 제품 목록 (SFR-017-04). 쪽 나눔은 표가 스스로 쥔다. */
export function InverterTable({ rows }: { rows: InverterProduct[] }) {
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

  const columns: Column<InverterProduct>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '90px',
      render: (row) => <span className={styles.stackCell__sub}>{row.inverterId}</span>,
    },
    {
      key: 'name',
      header: '인버터 모델 이름',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.name}</strong>
          <span className={styles.stackCell__sub}>
            {INVERTER_KIND_LABEL[row.kind]} · {row.phase}
          </span>
        </span>
      ),
    },
    { key: 'maker', header: '업체 이름', width: '170px', render: (row) => row.maker },
    {
      key: 'capacity',
      header: '용량',
      align: 'right',
      width: '110px',
      render: (row) => `${formatNumber(row.capacityKw, 1)} kW`,
    },
  ];

  return (
    <Reveal delay={0.05}>
      <Card title="인버터 제품 목록" description="설비 등록에서 고를 수 있는 인버터 모델 카탈로그입니다.">
        {rows.length === 0 ? (
          <EmptyState title="조건에 맞는 인버터 제품이 없습니다" description="검색어를 지우거나 새 제품을 등록해 보세요." />
        ) : (
          <>
            <Table
              caption="인버터 제품 목록. ID, 모델 이름, 업체 이름, 용량 순입니다."
              columns={columns}
              rows={pageRows}
              getRowKey={(row) => row.id}
              onRowClick={(row) => navigate(editPath('devices', 'inverter', 'inverterId', row.inverterId))}
            />
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              totalCount={rows.length}
              onChange={setPage}
              label="인버터 제품 목록"
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
