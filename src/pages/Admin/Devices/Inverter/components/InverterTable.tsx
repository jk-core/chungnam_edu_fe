import { useNavigate } from 'react-router-dom';
import { editPath } from '@/pages/Admin/_shared/adminPath';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { formatNumber } from '@/utils/format';
import { Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import type { Column } from '@/components/common/Table';
import type { ManageInverterPage } from '@/service/inverter/type';
import styles from '@/pages/Admin/Admin.module.scss';
import type { useInverterList } from '../hooks/useInverterList';

/** 인버터 제품 목록 (SFR-017-04). 쪽 나눔은 서버가 한다. */
export function InverterTable({ list }: { list: ReturnType<typeof useInverterList> }) {
  const navigate = useNavigate();

  const columns: Column<ManageInverterPage>[] = [
    {
      key: 'inverterId',
      header: 'ID',
      width: '90px',
      render: (row) => <span className={styles.stackCell__sub}>{row.inverterId}</span>,
    },
    {
      key: 'inverterName',
      header: '인버터 모델 이름',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.inverterName}</strong>
          <span className={styles.stackCell__sub}>
            {row.inverterTypeCodeName} · {row.phaseTypeName}
          </span>
        </span>
      ),
    },
    { key: 'inverterEnterpriseName', header: '업체 이름', width: '170px', render: (row) => row.inverterEnterpriseName },
    {
      key: 'inverterCapacity',
      header: '용량',
      align: 'right',
      width: '110px',
      render: (row) => `${formatNumber(row.inverterCapacity, 1)} kW`,
    },
  ];

  return (
    <Reveal delay={0.05}>
      <Card title="인버터 제품 목록" description="설비 등록에서 고를 수 있는 인버터 모델 카탈로그입니다.">
        {list.rows.length === 0 ? (
          <EmptyState title="조건에 맞는 인버터 제품이 없습니다" description="검색어를 지우거나 새 제품을 등록해 보세요." />
        ) : (
          <>
            <Table
              caption="인버터 제품 목록. ID, 모델 이름, 업체 이름, 용량 순입니다."
              columns={columns}
              rows={list.rows}
              getRowKey={(row) => String(row.inverterId)}
              onRowClick={(row) => navigate(editPath('devices', 'inverter', 'inverterId', row.inverterId))}
            />
            <Pagination
              page={list.param.page + 1}
              pageCount={list.pageCount}
              totalCount={list.totalCount}
              onChange={(page) => list.setParam((prev) => ({ ...prev, page: page - 1 }))}
              label="인버터 제품 목록"
              pageSize={list.param.size}
              onPageSizeChange={(size) => list.setParam((prev) => ({ ...prev, size, page: 0 }))}
            />
          </>
        )}
      </Card>
    </Reveal>
  );
}
