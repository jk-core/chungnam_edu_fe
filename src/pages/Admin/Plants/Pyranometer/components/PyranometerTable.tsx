import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { editPath } from '@/pages/Admin/_shared/adminPath';
import { Card } from '@/components/common/Card';
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import type { Column } from '@/components/common/Table';
import type { Pyranometer } from '@/interface/deviceMaster';
import styles from '@/pages/Admin/Admin.module.scss';

/** 일사량계 목록 (SFR-016-01). 쪽 나눔은 표가 스스로 쥔다. */
export function PyranometerTable({ rows }: { rows: Pyranometer[] }) {
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

  const columns: Column<Pyranometer>[] = [
    {
      key: 'irradId',
      header: '일사량계 ID',
      width: '100px',
      hideOnTablet: true,
      render: (row) => <span className={styles.stackCell__sub}>{row.irradId}</span>,
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
      key: 'comm',
      header: 'RTU 통신 ID · 포트',
      width: '160px',
      hideOnTablet: true,
      render: (row) => `${row.rtuCommId} · ${row.rtuPort}번`,
    },
    {
      key: 'thermometer',
      header: '모듈 온도계',
      width: '110px',
      align: 'center',
      render: (row) => (row.hasModuleThermometer ? '있음' : '없음'),
    },
  ];

  return (
    <Reveal delay={0.05}>
      <Card
        title="일사량계 목록"
        description="일사량은 AI 진단이 기대 발전량을 계산할 때 쓰는 값입니다. 캘리브레이션 인수를 정확히 넣어 주세요."
      >
        {rows.length === 0 ? (
          <EmptyState title="조건에 맞는 설비가 없습니다" description="검색어를 지우거나 새 설비를 등록해 보세요." />
        ) : (
          <>
            <Table
              caption="일사량계 목록. ID, 발전소와 설비 이름, 통신 설정, 모듈 온도계 순입니다."
              columns={columns}
              rows={pageRows}
              getRowKey={(row) => row.id}
              onRowClick={(row) => navigate(editPath('plants', 'pyranometer', 'irradId', row.irradId))}
            />
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              totalCount={rows.length}
              onChange={setPage}
              label="일사량계 목록"
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
