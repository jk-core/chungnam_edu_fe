import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { StatCard } from '@/components/common/StatCard';
import { Table } from '@/components/common/Table';
import { formatPercent } from '@/utils/format';
import { COLLECT_RATE_TARGET, getCollectionStatus, LINK_RATE_TARGET } from '@/mocks/collection';
import { usePlantScope } from '@/hooks/usePlantScope';
import { useCollectionDate } from '@/stores/filterStore';
import type { Column } from '@/components/common/Table';
import type { CollectionStatus } from '@/interface/collection';
import styles from '../Collection.module.scss';
import { CollectionFilter } from './CollectionFilter';

type StatusFilter = 'all' | 'incomplete';

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'incomplete', label: '결측 있음' },
];

const PAGE_SIZE = 15;

function rateTone(rate: number) {
  if (rate >= COLLECT_RATE_TARGET) return 'ok' as const;
  if (rate >= LINK_RATE_TARGET) return 'caution' as const;

  return 'critical' as const;
}

export function StatusTab() {
  const { plant, label } = usePlantScope();
  const [date] = useCollectionDate();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const all = getCollectionStatus(date).filter((row) => !plant || row.schoolId === plant.id);

    return filter === 'incomplete' ? all.filter((row) => row.missing > 0) : all;
  }, [date, plant, filter]);

  const summary = useMemo(() => {
    const source = getCollectionStatus(date).filter((row) => !plant || row.schoolId === plant.id);
    const expected = source.reduce((sum, row) => sum + row.expected, 0);
    const missing = source.reduce((sum, row) => sum + row.missing, 0);

    return {
      rate: expected > 0 ? (expected - missing) / expected : 0,
      missing,
      incomplete: source.filter((row) => row.missing > 0).length,
      worstDelay: source.reduce((max, row) => Math.max(max, row.delayMinutes), 0),
    };
  }, [date, plant]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const columns: Column<CollectionStatus>[] = [
    {
      key: 'school',
      header: '발전소',
      render: (row) => (
        <span className={styles.cellStack}>
          <span className={styles.cellStrong}>{row.schoolName}</span>
          <span className={styles.cellSub}>{row.regionName}</span>
        </span>
      ),
    },
    {
      key: 'rate',
      header: '수집률',
      align: 'right',
      width: '92px',
      render: (row) => <span className={styles.cellData}>{formatPercent(row.rate, 1)}</span>,
    },
    {
      key: 'bar',
      header: '수집 상태',
      hideOnTablet: true,
      render: (row) => (
        <span className={styles.rateBar}>
          <span className={styles.rateBar__fill} style={{ width: `${row.rate * 100}%` }} />
        </span>
      ),
    },
    {
      key: 'missing',
      header: '결측',
      align: 'right',
      width: '96px',
      render: (row) => (
        <span className={styles.cellData}>
          {row.missing} <span className={styles.cellSub}>/ {row.expected}</span>
        </span>
      ),
    },
    {
      key: 'last',
      header: '최종 수집',
      width: '156px',
      hideOnTablet: true,
      render: (row) => <span className={styles.cellMuted}>{row.lastCollectedAt}</span>,
    },
    {
      key: 'delay',
      header: '지연',
      align: 'right',
      width: '96px',
      render: (row) => (
        <span className={row.delayMinutes > 60 ? styles.deltaDown : styles.cellMuted}>
          {row.delayMinutes < 60 ? `${row.delayMinutes}분` : `${Math.floor(row.delayMinutes / 60)}시간`}
        </span>
      ),
    },
    {
      key: 'state',
      header: '판정',
      align: 'right',
      width: '92px',
      render: (row) => (
        <Badge tone={rateTone(row.rate)} withDot>
          {row.rate >= COLLECT_RATE_TARGET ? '정상' : row.rate >= LINK_RATE_TARGET ? '주의' : '점검필요'}
        </Badge>
      ),
    },
  ];

  return (
    <div className={styles.tab}>
      <CollectionFilter trailing={<p className={styles.toolbar__count}>{rows.length}개소</p>}>
        <SegmentedControl
          label="수집 상태 필터"
          size="sm"
          options={FILTER_OPTIONS}
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
        />
      </CollectionFilter>

      <div className={styles.grid3}>
        <Reveal>
          <StatCard
            label="전체 수집률"
            value={summary.rate * 100}
            unit="%"
            fractionDigits={2}
            meter={summary.rate}
            meterLabel={`목표 ${formatPercent(COLLECT_RATE_TARGET, 0)}`}
            accent
          />
        </Reveal>
        <Reveal delay={0.06}>
          <StatCard label="결측 건수" value={summary.missing} unit="건" meterLabel={`${summary.incomplete}개소`} />
        </Reveal>
        <Reveal delay={0.12}>
          <StatCard
            label="최대 수집 지연"
            value={summary.worstDelay}
            unit="분"
            meterLabel={summary.worstDelay > 60 ? '통신 확인 필요' : '정상 범위'}
          />
        </Reveal>
      </div>

      <Reveal delay={0.08}>
        <Card
          eyebrow="Status"
          title="설비별 수집 현황"
          description={`${label} 기준. 수집률이 낮은 설비를 위에 두었습니다.`}
          padding="none"
        >
          {rows.length === 0 ? (
            <EmptyState title="조건에 맞는 설비가 없습니다" description="필터를 바꿔 보세요." />
          ) : (
            <>
              <Table
                caption="설비별 수집률, 결측 건수, 최종 수집 시각, 지연 시간 표"
                columns={columns}
                rows={visible}
                getRowKey={(row) => row.schoolId}
                className={styles.tableInset}
              />
              <Pagination
                page={current}
                pageCount={pageCount}
                totalCount={rows.length}
                onChange={setPage}
                label="설비별 수집 현황"
              />
            </>
          )}
        </Card>
      </Reveal>
    </div>
  );
}
