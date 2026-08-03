import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { Card } from '@/components/common/Card';
import { REGIONS } from '@/mocks/regions';
import { Reveal } from '@/components/common/Reveal';
import { SCHOOLS } from '@/mocks/schools';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Select } from '@/components/common/Select';
import { Table } from '@/components/common/Table';
import { formatNumber, formatPercent } from '@/utils/format';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { Column } from '@/components/common/Table';
import type { School } from '@/interface/energy';
import styles from '../Statistics.module.scss';

type SortKey = 'today' | 'utilization' | 'capacity';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'today', label: '발전량' },
  { value: 'utilization', label: '이용률' },
  { value: 'capacity', label: '설비용량' },
];

const REGION_OPTIONS = [
  { value: 'all', label: '전체 시·군' },
  ...REGIONS.map((region) => ({ value: region.code, label: region.name })),
];

export function SchoolTab() {
  const [regionCode, setRegionCode] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('today');
  const { plant } = usePlantScope();

  const rows = useMemo(() => {
    const filtered = regionCode === 'all' ? SCHOOLS : SCHOOLS.filter((school) => school.regionCode === regionCode);

    const top = [...filtered]
      .sort((a, b) => {
        if (sortKey === 'utilization') return b.utilization - a.utilization;
        if (sortKey === 'capacity') return b.capacityKw - a.capacityKw;

        return b.todayKwh - a.todayKwh;
      })
      .slice(0, 20);

    // 선택한 발전소가 상위 20위 밖이면 비교할 수 있도록 맨 아래에 붙여 준다.
    if (plant && !top.some((school) => school.id === plant.id)) return [...top, plant];

    return top;
  }, [regionCode, sortKey, plant]);

  const max = Math.max(...rows.map((row) => row.todayKwh), 1);

  const columns: Column<School>[] = [
    {
      key: 'rank',
      header: '순위',
      width: '52px',
      render: (_row, index) => <span className={styles.cellRank}>{String(index + 1).padStart(2, '0')}</span>,
    },
    {
      key: 'name',
      header: '학교',
      render: (row) => (
        <span className={styles.cellSchool}>
          <span className={styles.cellStrong}>{row.name}</span>
          <span className={styles.cellSub}>{row.regionName}</span>
        </span>
      ),
    },
    {
      key: 'capacity',
      header: '설비용량 (kW)',
      align: 'right',
      width: '116px',
      hideOnTablet: true,
      render: (row) => <span className={styles.cellData}>{formatNumber(row.capacityKw, 1)}</span>,
    },
    {
      key: 'today',
      header: '금일 발전량 (kWh)',
      align: 'right',
      width: '150px',
      render: (row) => <span className={styles.cellData}>{formatNumber(row.todayKwh, 1)}</span>,
    },
    {
      key: 'bar',
      header: '비교',
      hideOnTablet: true,
      render: (row) => (
        <span className={styles.rowBar}>
          <span className={styles.rowBar__fill} style={{ width: `${(row.todayKwh / max) * 100}%` }} />
        </span>
      ),
    },
    {
      key: 'utilization',
      header: '이용률',
      align: 'right',
      width: '88px',
      render: (row) => <span className={styles.cellData}>{formatPercent(row.utilization, 1)}</span>,
    },
    {
      key: 'status',
      header: '상태',
      align: 'right',
      width: '104px',
      render: (row) => (
        <Badge tone={OPERATION_TONE[row.status]} withDot>
          {OPERATION_LABEL[row.status]}
        </Badge>
      ),
    },
  ];

  const regionLabel = regionCode === 'all' ? '전체' : REGIONS.find((region) => region.code === regionCode)?.name;

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <Select label="시·군" value={regionCode} options={REGION_OPTIONS} onChange={setRegionCode} hideLabel />
        <SegmentedControl label="정렬 기준" size="sm" options={SORT_OPTIONS} value={sortKey} onChange={setSortKey} />
      </div>

      <Reveal>
        <Card
          eyebrow="Ranking"
          title="학교별 발전 비교"
          description={
            plant
              ? `${regionLabel} 기준 상위 20개교입니다. 선택한 ${plant.name}는 강조 표시했습니다.`
              : `${regionLabel} 기준 상위 ${rows.length}개교입니다.`
          }
          padding="none"
        >
          <Table
            caption="학교별 설비용량, 금일 발전량, 이용률, 운영 상태 비교표"
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            getRowClassName={(row) => (row.id === plant?.id ? styles.rowHighlight : undefined)}
            className={styles.tableInset}
          />
        </Card>
      </Reveal>
    </div>
  );
}
