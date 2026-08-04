import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { INVERTER_PHASE_LABEL, INVERTER_TYPE_LABEL, INVERTERS, leafUnitsOf } from '@/mocks/equipment';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { StatCard } from '@/components/common/StatCard';
import { Table } from '@/components/common/Table';
import { TextField } from '@/components/common/Form';
import { formatNumber } from '@/utils/format';
import { getSchoolById } from '@/mocks/schools';
import type { Column } from '@/components/common/Table';
import type { Inverter } from '@/interface/equipment';
import type { OperationStatus } from '@/interface/status';
import styles from '../Admin.module.scss';

type Filter = 'all' | 'trouble';

const PAGE_SIZE = 12;

/** 인버터 기본 정보와 운영 상태 (SFR-017-04) */
export function DeviceInverters() {
  const [filter, setFilter] = useState<Filter>('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    return INVERTERS.filter((inverter) => {
      if (filter === 'trouble' && inverter.status === 'running') return false;
      if (!trimmed) return true;

      const school = getSchoolById(inverter.schoolId);

      return (school?.name ?? '').includes(trimmed) || inverter.name.includes(trimmed);
    });
  }, [filter, keyword]);

  const totalCapacity = INVERTERS.reduce((sum, inverter) => sum + inverter.capacityKw, 0);
  const troubled = INVERTERS.filter((inverter) => inverter.status !== 'running').length;

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const columns: Column<Inverter>[] = [
    {
      key: 'plant',
      header: '발전소 · 인버터',
      render: (row) => (
        <span className={styles.stackCell}>
          <strong>{getSchoolById(row.schoolId)?.name ?? row.schoolId}</strong>
          <span className={styles.stackCell__sub}>{row.name}</span>
        </span>
      ),
    },
    { key: 'type', header: '유형', width: '100px', render: (row) => INVERTER_TYPE_LABEL[row.type] },
    { key: 'phase', header: '위상', width: '110px', hideOnTablet: true, render: (row) => INVERTER_PHASE_LABEL[row.phase] },
    {
      key: 'capacity',
      header: '용량',
      align: 'right',
      width: '90px',
      render: (row) => `${formatNumber(row.capacityKw, 1)}kW`,
    },
    {
      key: 'units',
      header: '구성',
      width: '110px',
      hideOnTablet: true,
      // 스트링형은 스트링을, 센트럴형은 접속반을 센다 — 무엇을 세는지 함께 적는다.
      render: (row) => (row.type === 'string'
        ? `스트링 ${row.strings.length}조`
        : `접속반 ${row.junctionBoxes.length}면 · 채널 ${leafUnitsOf(row).length}회로`),
    },
    {
      key: 'status',
      header: '운영 상태',
      width: '110px',
      render: (row) => (
        <Badge tone={OPERATION_TONE[row.status]} withDot>
          {OPERATION_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: 'fault',
      header: '고장코드',
      width: '100px',
      align: 'center',
      render: (row) => (row.faultCode ? <Badge tone="critical">{row.faultCode}</Badge> : '—'),
    },
    {
      key: 'temperature',
      header: '내부 온도',
      align: 'right',
      width: '100px',
      hideOnTablet: true,
      render: (row) => (row.status === 'commLost' ? '—' : `${formatNumber(row.temperature, 1)}℃`),
    },
  ];

  return (
    <>
      <Reveal>
        <div className={`${styles.summary} ${styles['summary--three']}`}>
          <StatCard label="인버터" value={INVERTERS.length} unit="대" />
          <StatCard label="합계 용량" value={totalCapacity} unit="kW" fractionDigits={1} accent />
          <StatCard label="정상 아님" value={troubled} unit="대" />
        </div>
      </Reveal>

      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <SegmentedControl
            value={filter}
            onChange={(value) => {
              setFilter(value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: '전체' },
              { value: 'trouble', label: '정상 아님' },
            ]}
            label="운영 상태 필터"
          />
          <TextField
            label="발전소 검색"
            value={keyword}
            onChange={(value) => {
              setKeyword(value);
              setPage(1);
            }}
            placeholder="발전소·인버터 검색"
            width="md"
          />
        </div>
        <p className={styles.toolbar__note}>{formatNumber(rows.length)}대</p>
      </div>

      <Reveal delay={0.05}>
        <Card
          eyebrow="Inverter"
          title="인버터 목록"
          description="용량·유형·위상과 지금 운영 상태를 함께 봅니다."
        >
          {rows.length === 0 ? (
            <EmptyState title="조건에 맞는 인버터가 없습니다" description="검색어를 지우거나 필터를 넓혀 보세요." />
          ) : (
            <>
              <Table
                caption="인버터 목록. 발전소와 인버터, 유형, 위상, 용량, 구성, 운영 상태, 고장코드, 내부 온도 순입니다."
                columns={columns}
                rows={pageRows}
                getRowKey={(row) => row.id}
                getRowClassName={(row) => (isAlert(row.status) ? styles.rowAlert : undefined)}
              />
              <Pagination
                page={currentPage}
                pageCount={pageCount}
                totalCount={rows.length}
                onChange={setPage}
                label="인버터 목록"
              />
            </>
          )}
        </Card>
      </Reveal>
    </>
  );
}

/** 표에서 줄을 물들일 만큼 급한 상태인지 */
function isAlert(status: OperationStatus): boolean {
  return status === 'fault' || status === 'commLost';
}
