import { useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DownloadIcon } from '@/components/common/Icon';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Table } from '@/components/common/Table';
import { alertDurationMinutes } from '@/mocks/alerts';
import { formatDuration, formatNumber, formatPercent } from '@/utils/format';
import { useAlertRange } from '@/stores/filterStore';
import { useSnoozeMap } from '@/stores/faultActionStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { AlertRecord } from '@/interface/alert';
import type { Column } from '@/components/common/Table';
import styles from '../../Alerts.module.scss';
import { AlertDetailModal } from '../../components/AlertDetailModal';
import { detailOfAlert } from '../../components/alarmDetail';
import { FaultTimeline } from '../../components/FaultTimeline';
import { useAlertDetail } from '../hooks/useAlertDetail';
import { downloadAlerts } from './alertCsv';
import type { summarize } from '../../hooks/useAlertFilters';

type ViewMode = 'table' | 'timeline';

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'table', label: '표' },
  { value: 'timeline', label: '타임라인' },
];

const PAGE_SIZE = 12;

interface AlertHistoryCardProps {
  rows: AlertRecord[];
  stats: ReturnType<typeof summarize>;
}

/** 걸린 조건에 맞는 알림 이력 (SFR-022-03). 표와 타임라인 가운데 골라 본다. */
export function AlertHistoryCard({ rows, stats }: AlertHistoryCardProps) {
  const { plantLabel: label } = usePlantScope();
  const [range] = useAlertRange();
  const detail = useAlertDetail();
  const snoozedUntil = useSnoozeMap();

  const [view, setView] = useState<ViewMode>('table');
  const [page, setPage] = useState(1);
  const [shown, setShown] = useState(rows);

  // 조건이 바뀌면 첫 쪽으로 돌아간다. 3쪽을 보던 중 기간을 좁히면 빈 쪽이 남는다.
  if (shown !== rows) {
    setShown(rows);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const columns: Column<AlertRecord>[] = [
    {
      key: 'severity',
      header: '심각도',
      width: '88px',
      render: (row) => (
        <Badge tone={OPERATION_TONE[row.status]} withDot>
          {OPERATION_LABEL[row.status]}
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
        <button type="button" className={styles.cellLink} onClick={() => detail.open(row)}>
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
    <>
      <Reveal delay={0.1}>
        <Card
          title="알림 이력"
          description={`${label} 기준 ${formatNumber(rows.length)}건. 처리율 ${formatPercent(stats.handledRate, 1)}.`}
          action={
            <div className={styles.cardActions}>
              <SegmentedControl label="보기 방식" size="sm" options={VIEW_OPTIONS} value={view} onChange={setView} />
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<DownloadIcon />}
                onClick={() => downloadAlerts(rows, label, range)}
              >
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
          ) : rows.length === 0 ? (
            <EmptyState title="조건에 맞는 알림이 없습니다" description="기간이나 조건을 넓혀 보세요." />
          ) : (
            <>
              <Table
                caption="알림 이력 표. 심각도, 발생 일시, 내용, 발전소와 설비, 지속 시간, 조치 여부 순으로 구성됩니다."
                columns={columns}
                rows={visible}
                getRowKey={(row) => row.id}
                getRowClassName={(row) => (row.handled ? undefined : styles.rowPending)}
                className={styles.tableInset}
              />
              <Pagination
                page={current}
                pageCount={pageCount}
                totalCount={rows.length}
                onChange={setPage}
                label="알림 이력"
              />
            </>
          )}
        </Card>
      </Reveal>

      <AlertDetailModal
        alarm={detail.detail ? detailOfAlert(detail.detail, snoozedUntil[detail.detail.id] ?? null) : null}
        onClose={detail.close}
      />
    </>
  );
}
