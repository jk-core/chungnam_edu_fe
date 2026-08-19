import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { DB_HEALTH, RESOURCE_CRITICAL, RESOURCE_INCIDENTS, RESOURCE_WARNING, resourceLevel, SERVER_ROLE_LABEL, SERVERS, worstLevel } from '@/mocks/serverHealth';
import { EChart } from '@/components/common/EChart';
import { NOW } from '@/mocks/today';
import { Reveal } from '@/components/common/Reveal';
import { StatCard } from '@/components/common/StatCard';
import { Table } from '@/components/common/Table';
import { cn } from '@/utils/cn';
import { seriesPalette } from '@/utils/chart';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { BadgeTone } from '@/components/common/Badge';
import type { Column } from '@/components/common/Table';
import type { ResourceIncident, ResourceLevel, ServerNode } from '@/interface/serverHealth';
import styles from '../Admin.module.scss';
import type { EChartsOption } from 'echarts';

const LEVEL_LABEL: Record<ResourceLevel, string> = {
  normal: '정상',
  warning: '주의',
  critical: '위험',
};

const LEVEL_TONE: Record<ResourceLevel, BadgeTone> = {
  normal: 'ok',
  warning: 'caution',
  critical: 'critical',
};

const AXIS_FONT = { fontSize: 11, fontFamily: 'Pretendard Variable, sans-serif' };

/**
 * 서버 자원·DB 상태 모니터링 (ECR-002-20/21, ECR-003-13).
 * 사용률을 그대로 보여 주는 데 그치지 않고, 임계선을 넘은 건을 맨 위로 끌어올린다.
 */
function ServerHealthPage() {
  const palette = useChartPalette();
  const colors = seriesPalette(palette);

  const down = SERVERS.filter((server) => !server.up).length;
  const worstCpu = Math.max(...SERVERS.map((server) => server.cpu));
  const avgCpu = SERVERS.reduce((sum, server) => sum + server.cpu, 0) / SERVERS.length;

  /** 서버별 24시간 CPU 추이 — 임계선을 함께 긋는다 */
  const trendOption: EChartsOption = {
    grid: { top: 30, right: 16, bottom: 24, left: 40 },
    legend: { top: 0, textStyle: { color: palette.textMuted, fontSize: 11 } },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12 },
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, hour) => `${hour}시`),
      axisLabel: { color: palette.textMuted, ...AXIS_FONT, interval: 2 },
      axisLine: { lineStyle: { color: palette.axis } },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { color: palette.textMuted, formatter: '{value}%', ...AXIS_FONT },
      splitLine: { lineStyle: { color: palette.grid } },
    },
    series: SERVERS.map((server, index) => ({
      name: server.name,
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 1.8, color: colors[index % colors.length] },
      itemStyle: { color: colors[index % colors.length] },
      data: server.cpuTrend,
      // 임계선은 한 계열에만 얹는다 — 계열마다 그으면 같은 선이 겹쳐 보인다.
      markLine: index === 0
        ? {
          silent: true,
          symbol: 'none',
          label: { color: palette.textMuted, fontSize: 10 },
          lineStyle: { color: palette.critical, type: 'dashed' },
          data: [
            { yAxis: RESOURCE_CRITICAL, name: '위험' },
            { yAxis: RESOURCE_WARNING, name: '주의', lineStyle: { color: palette.caution, type: 'dashed' } },
          ],
        }
        : undefined,
    })),
  };

  const incidentColumns: Column<ResourceIncident>[] = [
    { key: 'at', header: '발생 시각', width: '150px', render: (row) => row.at },
    { key: 'server', header: '서버', width: '100px', render: (row) => <strong>{row.serverName}</strong> },
    {
      key: 'metric',
      header: '지표',
      width: '110px',
      render: (row) => `${row.metric} ${formatNumber(row.value)}%`,
    },
    {
      key: 'level',
      header: '등급',
      width: '90px',
      render: (row) => (
        <Badge tone={LEVEL_TONE[row.level]} withDot>
          {LEVEL_LABEL[row.level]}
        </Badge>
      ),
    },
    { key: 'note', header: '내용', render: (row) => row.note },
    {
      key: 'resolved',
      header: '해소',
      width: '150px',
      align: 'right',
      render: (row) => row.resolvedAt ?? <Badge tone="critical">진행 중</Badge>,
    },
  ];

  return (
    <div className={styles.tab}>
      <Reveal delay={0.04}>
        <div className={`${styles.summary} ${styles['summary--three']}`}>
          <StatCard label="가동 서버" value={SERVERS.length - down} unit={`대 / ${SERVERS.length}대`} accent />
          <StatCard label="평균 CPU" value={avgCpu} unit="%" fractionDigits={1} meter={avgCpu / 100} />
          <StatCard
            label="최고 CPU"
            value={worstCpu}
            unit="%"
            meter={worstCpu / 100}
            meterLabel={`주의 ${RESOURCE_WARNING}% · 위험 ${RESOURCE_CRITICAL}%`}
          />
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <Card
          title="서버 자원 사용률"
          description={`${NOW.format('HH:mm')} 기준. CPU·메모리·디스크가 임계선을 넘으면 카드에 색이 들어옵니다.`}
        >
          <div className={styles.serverGrid}>
            {SERVERS.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.08}>
        <Card title="24시간 CPU 사용률" description="점선은 주의·위험 임계선입니다.">
          <EChart
            option={trendOption}
            height={300}
            summary={`서버 ${SERVERS.length}대의 24시간 CPU 추이. 최고 ${formatNumber(worstCpu)}%.`}
          />
        </Card>
      </Reveal>

      <Reveal delay={0.1}>
        <Card title="데이터베이스 상태" description="연결 수와 저장소, 백업·복제 지연을 함께 봅니다.">
          <dl className={styles.infoGrid}>
            <div>
              <dt>연결</dt>
              <dd>{formatNumber(DB_HEALTH.connections)} / {formatNumber(DB_HEALTH.maxConnections)}</dd>
            </div>
            <div>
              <dt>초당 질의</dt>
              <dd>{formatNumber(DB_HEALTH.qps)} QPS</dd>
            </div>
            <div>
              <dt>가장 느린 질의</dt>
              <dd>{formatNumber(DB_HEALTH.slowestSeconds, 1)}초</dd>
            </div>
            <div>
              <dt>저장소 사용률</dt>
              <dd>{formatNumber(DB_HEALTH.storageUsed)}%</dd>
            </div>
            <div>
              <dt>마지막 백업</dt>
              <dd>{DB_HEALTH.lastBackupAt}</dd>
            </div>
            <div>
              <dt>복제 지연</dt>
              <dd>{formatNumber(DB_HEALTH.replicaLagSeconds, 1)}초</dd>
            </div>
          </dl>
        </Card>
      </Reveal>

      <Reveal delay={0.12}>
        <Card title="임계 초과 이력" description="언제 무엇이 어디까지 올라갔는지 남습니다.">
          <Table
            caption="자원 임계 초과 이력. 발생 시각, 서버, 지표, 등급, 내용, 해소 시각 순입니다."
            columns={incidentColumns}
            rows={RESOURCE_INCIDENTS}
            getRowKey={(row) => row.id}
            getRowClassName={(row) => (row.resolvedAt === null ? styles.rowAlert : undefined)}
          />
        </Card>
      </Reveal>
    </div>
  );
}

/** 서버 한 대 — 사용률 셋을 막대로 세워 둔다 */
function ServerCard({ server }: { server: ServerNode }) {
  const level = worstLevel(server);

  return (
    <div
      className={cn(styles.server, {
        [styles['server--warning']]: level === 'warning',
        [styles['server--critical']]: level === 'critical',
      })}
    >
      <p className={styles.server__head}>
        <strong>{server.name}</strong>
        <Badge tone={server.up ? LEVEL_TONE[level] : 'critical'} withDot>
          {server.up ? LEVEL_LABEL[level] : '중지'}
        </Badge>
      </p>
      <p className={styles.server__role}>
        {SERVER_ROLE_LABEL[server.role]} · {formatNumber(server.uptimeDays)}일 연속 가동
      </p>

      <Meter label="CPU" value={server.cpu} />
      <Meter label="메모리" value={server.memory} />
      <Meter label="디스크" value={server.disk} />

      <p className={styles.server__net}>네트워크 {formatNumber(server.networkMbps)}Mbps</p>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  const level = resourceLevel(value);

  return (
    <div className={styles.meter}>
      <span className={styles.meter__label}>{label}</span>
      <span className={styles.meter__track}>
        <span
          className={cn(styles.meter__bar, {
            [styles['meter__bar--warning']]: level === 'warning',
            [styles['meter__bar--critical']]: level === 'critical',
          })}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </span>
      <span className={styles.meter__value}>{formatNumber(value)}%</span>
    </div>
  );
}

export default ServerHealthPage;
