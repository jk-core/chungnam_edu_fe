import { useState } from 'react';
import { ALERT_TYPES, alertDurationMinutes } from '@/mocks/alerts';
import { Badge, SEVERITY_LABEL, SEVERITY_TONE } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { DownloadIcon } from '@/components/common/Icon';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Select } from '@/components/common/Select';
import { StatCard } from '@/components/common/StatCard';
import { Table } from '@/components/common/Table';
import { formatDuration, formatNumber, formatPercent } from '@/utils/format';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { AlertRecord, AlertType } from '@/interface/alert';
import type { Column } from '@/components/common/Table';
import type { Severity } from '@/interface/energy';
import styles from '../Alerts.module.scss';
import { summarize, useAlertFilters } from './useAlertFilters';
import { AlertDetailModal } from './AlertDetailModal';
import { AlertTimeline } from './AlertTimeline';

type ViewMode = 'table' | 'timeline';

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'table', label: '표' },
  { value: 'timeline', label: '타임라인' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: '전체 유형' },
  ...ALERT_TYPES.map((type) => ({ value: type, label: type })),
];

const SEVERITY_OPTIONS = [
  { value: 'all', label: '전체 심각도' },
  { value: 'critical', label: '긴급' },
  { value: 'caution', label: '주의' },
  { value: 'info', label: '참고' },
];

const HANDLED_OPTIONS = [
  { value: 'all', label: '조치 전체' },
  { value: 'pending', label: '미조치' },
  { value: 'handled', label: '조치 완료' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'longest', label: '지속 시간순' },
];

const PAGE_SIZE = 12;

export function ListTab() {
  const { plantLabel: label } = usePlantScope();
  const { range, setRange, filters, setFilters, results, isDirty, reset } = useAlertFilters();
  const [view, setView] = useState<ViewMode>('table');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AlertRecord | null>(null);

  const stats = summarize(results);
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const columns: Column<AlertRecord>[] = [
    {
      key: 'severity',
      header: '심각도',
      width: '88px',
      render: (row) => (
        <Badge tone={SEVERITY_TONE[row.severity]} withDot>
          {SEVERITY_LABEL[row.severity]}
        </Badge>
      ),
    },
    {
      key: 'occurredAt',
      header: '발생 일시',
      width: '150px',
      render: (row) => <span className={styles.cellData}>{row.occurredAt}</span>,
    },
    {
      key: 'title',
      header: '내용',
      render: (row) => (
        <button type="button" className={styles.cellLink} onClick={() => setSelected(row)}>
          <span className={styles.cellStrong}>{row.title}</span>
          <span className={styles.cellSub}>{row.description}</span>
        </button>
      ),
    },
    {
      key: 'school',
      header: '발전소 · 설비',
      width: '190px',
      hideOnTablet: true,
      render: (row) => (
        <span className={styles.cellStack}>
          <span className={styles.cellMuted}>{row.schoolName}</span>
          <span className={styles.cellSub}>{row.deviceName}</span>
        </span>
      ),
    },
    {
      key: 'type',
      header: '유형',
      width: '72px',
      hideOnTablet: true,
      render: (row) => <Badge tone="neutral">{row.type}</Badge>,
    },
    {
      key: 'duration',
      header: '지속 시간',
      align: 'right',
      width: '110px',
      hideOnTablet: true,
      render: (row) => (
        <span className={row.handled ? styles.cellData : styles.deltaDown}>
          {formatDuration(alertDurationMinutes(row))}
        </span>
      ),
    },
    {
      key: 'handled',
      header: '조치',
      align: 'right',
      width: '104px',
      render: (row) => (
        <Badge tone={row.handled ? 'ok' : 'critical'} withDot>
          {row.handled ? (row.manual ? '수동 조치' : '자동 복구') : '미조치'}
        </Badge>
      ),
    },
  ];

  return (
    <div className={styles.tab}>
      <div className={styles.grid3}>
        <Reveal>
          <StatCard
            label="미조치 알림"
            value={stats.pending}
            unit="건"
            meterLabel={`긴급 ${stats.pendingCritical}건`}
            meter={stats.total > 0 ? stats.pending / stats.total : 0}
          />
        </Reveal>
        <Reveal delay={0.06}>
          <StatCard
            label="처리율"
            value={stats.handledRate * 100}
            unit="%"
            fractionDigits={1}
            meter={stats.handledRate}
            meterLabel={`전체 ${formatNumber(stats.total)}건`}
            accent
          />
        </Reveal>
        <Reveal delay={0.12}>
          <StatCard
            label="평균 처리 시간"
            value={stats.averageMinutes / 60}
            unit="시간"
            fractionDigits={1}
            meterLabel={`수동 조치 ${stats.manualCount}건`}
          />
        </Reveal>
      </div>

      <Reveal delay={0.06}>
        <Card eyebrow="Filter" title="조회 조건" padding="md" variant="outline">
          <div className={styles.filters}>
            <DateRangePicker value={range} onChange={setRange} label="조회 기간" />
            <Select
              label="유형"
              hideLabel
              value={filters.type}
              options={TYPE_OPTIONS}
              onChange={(value) => setFilters((prev) => ({ ...prev, type: value as AlertType | 'all' }))}
            />
            <Select
              label="심각도"
              hideLabel
              value={filters.severity}
              options={SEVERITY_OPTIONS}
              onChange={(value) => setFilters((prev) => ({ ...prev, severity: value as Severity | 'all' }))}
            />
            <Select
              label="조치 여부"
              hideLabel
              value={filters.handled}
              options={HANDLED_OPTIONS}
              onChange={(value) => setFilters((prev) => ({ ...prev, handled: value as typeof prev.handled }))}
            />
            <Select
              label="정렬"
              hideLabel
              value={filters.sort}
              options={SORT_OPTIONS}
              onChange={(value) => setFilters((prev) => ({ ...prev, sort: value as typeof prev.sort }))}
            />
            {isDirty ? (
              <Button variant="ghost" size="sm" onClick={reset}>
                조건 초기화
              </Button>
            ) : null}
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.1}>
        <Card
          eyebrow="Alerts"
          title="알림 이력"
          description={`${label} 기준 ${formatNumber(results.length)}건. 처리율 ${formatPercent(stats.handledRate, 1)}.`}
          action={
            <div className={styles.cardActions}>
              <SegmentedControl label="보기 방식" size="sm" options={VIEW_OPTIONS} value={view} onChange={setView} />
              <Button variant="secondary" size="sm" iconLeft={<DownloadIcon />}>
                엑셀 내려받기
              </Button>
            </div>
          }
          padding="none"
        >
          {results.length === 0 ? (
            <EmptyState title="조건에 맞는 알림이 없습니다" description="기간이나 조건을 넓혀 보세요." />
          ) : view === 'table' ? (
            <>
              <Table
                caption="알림 이력 표. 심각도, 발생 일시, 내용, 발전소와 설비, 유형, 지속 시간, 조치 여부 순으로 구성됩니다."
                columns={columns}
                rows={visible}
                getRowKey={(row) => row.id}
                getRowClassName={(row) => (row.handled ? undefined : styles.rowPending)}
                className={styles.tableInset}
              />
              <Pagination
                page={current}
                pageCount={pageCount}
                totalCount={results.length}
                onChange={setPage}
                label="알림 이력"
              />
            </>
          ) : (
            <AlertTimeline
              alerts={results.slice(0, 24)}
              start={range.start}
              end={range.end}
              onSelect={setSelected}
            />
          )}
        </Card>
      </Reveal>

      <AlertDetailModal alert={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
