import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { CELL_TYPE } from '@/configs/codes';
import { editPath } from '@/pages/Admin/_shared/adminPath';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import type { Column } from '@/components/common/Table';
import type { ManageSolaModulePage } from '@/service/module/type';
import styles from '@/pages/Admin/Admin.module.scss';
import type { useModuleList } from '../hooks/useModuleList';

/** 모듈 제품 목록 (SFR-016-01). 쪽 나눔은 서버가 한다. */
export function ModuleTable({ list }: { list: ReturnType<typeof useModuleList> }) {
  const navigate = useNavigate();

  const columns: Column<ManageSolaModulePage>[] = [
    {
      key: 'moduleId',
      header: '모듈 ID',
      width: '90px',
      hideOnTablet: true,
      render: (row) => <span className={styles.stackCell__sub}>{row.moduleId}</span>,
    },
    {
      key: 'moduleName',
      header: '모듈명 · 업체',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.moduleName}</strong>
          <span className={styles.stackCell__sub}>{row.moduleEnterpriseName}</span>
        </span>
      ),
    },
    { key: 'pwrMp', header: '용량', align: 'right', width: '90px', render: (row) => `${formatNumber(row.pwrMp)}W` },
    {
      key: 'cellTypeCode',
      header: '셀 종류',
      width: '90px',
      align: 'center',
      render: (row) => (
        <Badge tone={row.cellTypeCode === CELL_TYPE.CODE.양면 ? 'brand' : 'neutral'}>{row.cellTypeName}</Badge>
      ),
    },
  ];

  return (
    <Reveal delay={0.05}>
      <Card
        title="모듈 제품"
        description="여기에 등록한 제품을 설비 등록에서 고릅니다. 용량은 설비용량 산출에 그대로 쓰입니다."
      >
        {list.rows.length === 0 ? (
          <EmptyState title="조건에 맞는 제품이 없습니다" description="검색어를 지우거나 새 제품을 등록해 보세요." />
        ) : (
          <>
            <Table
              caption="모듈 제품 목록. ID, 모듈명과 업체, 용량, 셀 종류 순입니다."
              columns={columns}
              rows={list.rows}
              getRowKey={(row) => String(row.moduleId)}
              onRowClick={(row) => navigate(editPath('devices', 'module', 'moduleId', row.moduleId))}
            />
            <Pagination
              page={list.param.page + 1}
              pageCount={list.pageCount}
              totalCount={list.totalCount}
              onChange={(page) => list.setParam((prev) => ({ ...prev, page: page - 1 }))}
              label="모듈 제품 목록"
              pageSize={list.param.size}
              onPageSizeChange={(size) => list.setParam((prev) => ({ ...prev, size, page: 0 }))}
            />
          </>
        )}
      </Card>
    </Reveal>
  );
}
