import { Badge, SEVERITY_LABEL, SEVERITY_TONE } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ISSUES } from '@/mocks/diagnosis';
import { Reveal } from '@/components/common/Reveal';
import { Sparkline } from '@/components/common/Sparkline';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import { formatShort, isWithinRange } from '@/utils/date';
import { usePlantScope } from '@/hooks/usePlantScope';
import { useDiagnosisRange } from '@/stores/filterStore';
import type { Column } from '@/components/common/Table';
import type { Issue } from '@/interface/energy';
import styles from '../AiDiagnosis.module.scss';
import { AnalysisFilter } from './AnalysisFilter';

const columns: Column<Issue>[] = [
  {
    key: 'id',
    header: '번호',
    width: '132px',
    render: (row) => <span className={styles.cellId}>{row.id}</span>,
  },
  {
    key: 'school',
    header: '학교 · 설비',
    render: (row) => (
      <span className={styles.cellStack}>
        <span className={styles.cellStrong}>{row.schoolName}</span>
        <span className={styles.cellSub}>
          {row.regionName} · {row.device}
        </span>
      </span>
    ),
  },
  {
    key: 'category',
    header: '유형',
    width: '134px',
    hideOnTablet: true,
    render: (row) => <span className={styles.cellMuted}>{row.category}</span>,
  },
  {
    key: 'trend',
    header: '추이',
    width: '110px',
    hideOnTablet: true,
    render: (row) => (
      <Sparkline
        values={row.trend}
        tone={row.severity === 'critical' ? 'critical' : row.severity === 'caution' ? 'caution' : 'brand'}
        width={92}
        height={28}
      />
    ),
  },
  {
    key: 'loss',
    header: '추정 손실',
    align: 'right',
    width: '110px',
    render: (row) => <span className={styles.cellData}>{formatNumber(row.lossKwh, 1)}</span>,
  },
  {
    key: 'detectedAt',
    header: '검출 시각',
    width: '148px',
    hideOnTablet: true,
    render: (row) => <span className={styles.cellMuted}>{row.detectedAt}</span>,
  },
  {
    key: 'severity',
    header: '심각도',
    align: 'right',
    width: '92px',
    render: (row) => (
      <Badge tone={SEVERITY_TONE[row.severity]} withDot>
        {SEVERITY_LABEL[row.severity]}
      </Badge>
    ),
  },
];

export function HistoryTab() {
  const { plant, plantLabel: label } = usePlantScope();
  const [range] = useDiagnosisRange();
  const rows = ISSUES.filter(
    (issue) => (!plant || issue.schoolId === plant.id) && isWithinRange(issue.detectedAt, range.start, range.end),
  );

  return (
    <div className={styles.tab}>
      <AnalysisFilter trailing={<p className={styles.toolbar__count}>{rows.length}건</p>} />

      <Reveal>
        <Card
          eyebrow="History"
          title="이상 이력"
          description={`${label} · ${formatShort(range.start)} ~ ${formatShort(range.end)}. 추정 손실은 하루 기준 발전량 감소분입니다.`}
          padding="none"
        >
          {rows.length === 0 ? (
            <EmptyState
              title="검출된 이상 이력이 없습니다"
              description={`${label}에서는 이 기간에 검출된 이상이 없습니다. 기간을 넓혀 보세요.`}
            />
          ) : (
            <Table
              caption="이상 이력 표. 번호, 학교와 설비, 유형, 추이, 추정 손실, 검출 시각, 심각도로 구성됩니다."
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              className={styles.tableInset}
            />
          )}
        </Card>
      </Reveal>
    </div>
  );
}
