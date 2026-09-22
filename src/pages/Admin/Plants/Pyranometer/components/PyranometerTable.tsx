import { useNavigate } from 'react-router-dom';
import { editPath } from '@/pages/Admin/_shared/adminPath';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import type { Column } from '@/components/common/Table';
import type { ManageIrradPage } from '@/service/irrad/type';
import styles from '@/pages/Admin/Admin.module.scss';
import type { usePyranometerList } from '../hooks/usePyranometerList';

/** 일사량계 목록 (SFR-016-01). 쪽 나눔은 서버가 한다. */
export function PyranometerTable({ list }: { list: ReturnType<typeof usePyranometerList> }) {
  const navigate = useNavigate();

  const columns: Column<ManageIrradPage>[] = [
    {
      key: 'irradId',
      header: '일사량계 ID',
      width: '100px',
      hideOnTablet: true,
      render: (row) => <span className={styles.stackCell__sub}>{row.irradId}</span>,
    },
    {
      key: 'powerPlantName',
      header: '발전소 · 설비',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{row.powerPlantName}</strong>
          <span className={styles.stackCell__sub}>{row.irradName}</span>
        </span>
      ),
    },
    {
      key: 'rtuCommunicationId',
      header: 'RTU 통신 ID · 포트',
      width: '160px',
      hideOnTablet: true,
      render: (row) => `${row.rtuCommunicationId} · ${row.rtuPort}번`,
    },
    {
      key: 'isModTemp',
      header: '모듈 온도계',
      width: '110px',
      align: 'center',
      render: (row) => (row.isModTemp ? '있음' : '없음'),
    },
  ];

  return (
    <Reveal delay={0.05}>
      <Card
        title="일사량계 목록"
        description="일사량은 AI 진단이 기대 발전량을 계산할 때 쓰는 값입니다. 캘리브레이션 인수를 정확히 넣어 주세요."
      >
        {list.rows.length === 0 ? (
          <EmptyState title="조건에 맞는 설비가 없습니다" description="검색어를 지우거나 새 설비를 등록해 보세요." />
        ) : (
          <>
            <Table
              caption="일사량계 목록. ID, 발전소와 설비 이름, 통신 설정, 모듈 온도계 순입니다."
              columns={columns}
              rows={list.rows}
              getRowKey={(row) => String(row.irradId)}
              onRowClick={(row) => navigate(editPath('plants', 'pyranometer', 'irradId', row.irradId))}
            />
            <Pagination
              page={list.param.page + 1}
              pageCount={list.pageCount}
              totalCount={list.totalCount}
              onChange={(page) => list.setParam((prev) => ({ ...prev, page: page - 1 }))}
              label="일사량계 목록"
              pageSize={list.param.size}
              onPageSizeChange={(size) => list.setParam((prev) => ({ ...prev, size, page: 0 }))}
            />
          </>
        )}
      </Card>
    </Reveal>
  );
}
