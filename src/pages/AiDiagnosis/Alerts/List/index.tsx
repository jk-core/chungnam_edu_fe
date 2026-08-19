import dayjs from 'dayjs';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ALERT_RECORDS, ALERT_TYPES, alertDurationMinutes } from '@/mocks/alerts';
import { Badge, SEVERITY_LABEL, SEVERITY_TONE } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DatePicker } from '@/components/common/DatePicker';
import { DownloadIcon } from '@/components/common/Icon';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Select } from '@/components/common/Select';
import { StatCard } from '@/components/common/StatCard';
import { Table } from '@/components/common/Table';
import { MSG } from '@/configs/messages';
import { exportCsv } from '@/utils/export';
import { formatShort } from '@/utils/date';
import { formatDuration, formatNumber, formatPercent } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { AlertRecord, AlertType } from '@/interface/alert';
import type { Column } from '@/components/common/Table';
import type { Granularity } from '@/utils/date';
import type { CsvColumn } from '@/utils/export';
import type { Severity } from '@/interface/energy';
import styles from '../Alerts.module.scss';
import { summarize, useAlertFilters } from '../hooks/useAlertFilters';
import { AlertDetailModal } from '../components/AlertDetailModal';
import { FaultTimeline } from '../components/FaultTimeline';

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

const UNIT_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'day', label: '일별' },
  { value: 'month', label: '월별' },
  { value: 'year', label: '연도별' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'longest', label: '지속 시간순' },
];

const PAGE_SIZE = 12;

function ListView() {
  const { plantLabel: label } = usePlantScope();
  const { range, setRange, filters, setFilters, results, isDirty, reset } = useAlertFilters();
  const [view, setView] = useState<ViewMode>('table');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AlertRecord | null>(null);
  const [params, setParams] = useSearchParams();

  /*
    헤더 종에서 건너온 알림.

    종은 어느 화면에서나 도 전체를 가리키지만 이 목록은 조회 대상과 기간으로 거른다 —
    누른 알림이 목록에 없을 수 있으므로, 걸러진 결과가 아니라 원본에서 그 건을 찾는다.
    상태로 옮겨 담지 않고 주소에서 바로 읽는다. 옮겨 담으면 주소와 화면이 어긋날 자리가 생긴다.
  */
  const linkedId = params.get('alert');
  const linked = linkedId ? ALERT_RECORDS.find((alert) => alert.id === linkedId) ?? null : null;
  const detail = selected ?? linked;

  /** 닫으면 주소에서도 지운다 — 남겨 두면 뒤로 갔다 오거나 새로 고칠 때 다시 열린다. */
  const closeDetail = () => {
    setSelected(null);

    if (!linkedId) return;

    params.delete('alert');
    setParams(params, { replace: true });
  };

  /*
   * 조회 기간은 일·월·연 단위로 고른다 (SFR-022-01/02).
   * 고르는 달력 안에 그 날짜의 날씨(월·연은 발전시간)가 함께 나온다 —
   * 알림이 뜬 날 발전이 어땠는지 같은 자리에서 읽으라는 뜻이다.
   */
  const [unit, setUnit] = useState<Granularity>('month');
  const [anchor, setAnchor] = useState<Date>(() => range.end);

  const applyPeriod = (nextUnit: Granularity, nextAnchor: Date) => {
    const cursor = dayjs(nextAnchor);

    setUnit(nextUnit);
    setAnchor(nextAnchor);
    setRange({ start: cursor.startOf(nextUnit).toDate(), end: cursor.endOf(nextUnit).toDate() });
    setPage(1);
  };

  const stats = summarize(results);

  // 표에는 자리가 없어 줄인 항목까지 그대로 담는다 (SFR-022-03).
  const csvColumns: CsvColumn<AlertRecord>[] = [
    { header: '알림시간', value: (row) => row.occurredAt },
    { header: '발전소', value: (row) => row.schoolName },
    { header: '설비명', value: (row) => row.deviceName },
    { header: '유형', value: (row) => row.type },
    { header: '심각도', value: (row) => SEVERITY_LABEL[row.severity] },
    { header: '알림원인', value: (row) => row.title },
    { header: '고장코드', value: (row) => row.faultCode ?? '' },
    { header: '조치여부', value: (row) => (row.handled ? '조치완료' : '미조치') },
    { header: '조치완료 시간', value: (row) => row.resolvedAt ?? '' },
    { header: '조치자', value: (row) => row.handler ?? '' },
  ];

  const download = () => {
    if (results.length === 0) {
      toast.error(MSG.noResult);

      return;
    }

    // range 는 Date 라 그대로 쓰면 파일명에 요일·시간대까지 붙는다.
    const filename = `알림이력_${label}_${formatShort(range.start)}~${formatShort(range.end)}`;

    exportCsv(filename, csvColumns, results);
    toast.success(MSG.downloadStart(filename));
  };

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
      header: '조치여부',
      align: 'right',
      width: '104px',
      render: (row) => (
        <Badge tone={row.handled ? 'ok' : 'critical'} withDot>
          {row.handled ? (row.manual ? '수동 조치' : '자동 복구') : '미조치'}
        </Badge>
      ),
    },
    {
      // 요구 표출항목에 조치완료 시각이 있다 (SFR-022-03). 누가 닫았는지도 같은 칸에 받쳐 준다.
      key: 'resolvedAt',
      header: '조치완료 시간',
      width: '150px',
      hideOnTablet: true,
      render: (row) => (row.resolvedAt ? (
        <span className={styles.cellStack}>
          <span className={styles.cellData}>{row.resolvedAt}</span>
          {row.handler ? <span className={styles.cellSub}>{row.handler}</span> : null}
        </span>
      ) : (
        <span className={styles.cellSub}>진행 중</span>
      )),
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
        <Card title="조회 조건" padding="md" variant="outline">
          <div className={styles.filters}>
            <SegmentedControl
              label="조회 단위"
              options={UNIT_OPTIONS}
              value={unit}
              onChange={(value) => applyPeriod(value, anchor)}
            />
            <DatePicker value={anchor} onChange={(value) => applyPeriod(unit, value)} granularity={unit} label="기준일" />
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
          title="알림 이력"
          description={`${label} 기준 ${formatNumber(results.length)}건. 처리율 ${formatPercent(stats.handledRate, 1)}.`}
          action={
            <div className={styles.cardActions}>
              <SegmentedControl label="보기 방식" size="sm" options={VIEW_OPTIONS} value={view} onChange={setView} />
              <Button variant="secondary" size="sm" iconLeft={<DownloadIcon />} onClick={download}>
                엑셀 내려받기
              </Button>
            </div>
          }
          padding="none"
        >
          {/*
            타임라인은 알림 한 줄이 아니라 고장 한 건이 언제부터 언제까지였는지를 본다.
            보는 것이 다르니 걸린 조건에 맞는 알림이 없어도 제 내용을 그린다 — 표일 때만 빈 화면을 낸다.
          */}
          {view === 'timeline' ? (
            <FaultTimeline />
          ) : results.length === 0 ? (
            <EmptyState title="조건에 맞는 알림이 없습니다" description="기간이나 조건을 넓혀 보세요." />
          ) : (
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
          )}
        </Card>
      </Reveal>

      <AlertDetailModal alert={detail} onClose={closeDetail} />
    </div>
  );
}

export default ListView;
