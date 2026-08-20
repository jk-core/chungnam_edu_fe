import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { RESOURCE_INCIDENTS } from '@/mocks/serverHealth';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import type { Column } from '@/components/common/Table';
import type { ResourceIncident } from '@/interface/serverHealth';
import styles from '../../Admin.module.scss';
import { LEVEL_LABEL, LEVEL_TONE } from './serverLevel';

const COLUMNS: Column<ResourceIncident>[] = [
  { key: 'at', header: '발생 시각', width: '150px', render: (row) => row.at },
  { key: 'server', header: '서버', width: '100px', render: (row) => <strong>{row.serverName}</strong> },
  { key: 'metric', header: '지표', width: '110px', render: (row) => `${row.metric} ${formatNumber(row.value)}%` },
  {
    key: 'level',
    header: '등급',
    width: '90px',
    render: (row) => <Badge tone={LEVEL_TONE[row.level]} withDot>{LEVEL_LABEL[row.level]}</Badge>,
  },
  { key: 'note', header: '내용', render: (row) => row.note },
  {
    key: 'resolved',
    header: '해소',
    width: '150px',
    align: 'right',
    // 아직 안 풀린 건은 시각 대신 배지를 세운다 — 빈칸으로 두면 기록이 빠진 것과 구별되지 않는다
    render: (row) => row.resolvedAt ?? <Badge tone="critical">진행 중</Badge>,
  },
];

/** 임계 초과 이력 (ECR-002-21). 아직 풀리지 않은 건은 줄 전체를 붉게 세운다. */
export function IncidentTable() {
  return (
    <Reveal delay={0.12}>
      <Card title="임계 초과 이력" description="언제 무엇이 어디까지 올라갔는지 남습니다.">
        <Table
          caption="자원 임계 초과 이력. 발생 시각, 서버, 지표, 등급, 내용, 해소 시각 순입니다."
          columns={COLUMNS}
          rows={RESOURCE_INCIDENTS}
          getRowKey={(row) => row.id}
          getRowClassName={(row) => (row.resolvedAt === null ? styles.rowAlert : undefined)}
        />
      </Card>
    </Reveal>
  );
}
