import type { DbHealth, ResourceIncident, ResourceLevel, ServerNode, ServerRole } from '@/interface/serverHealth';
import { RESOURCE_CRITICAL, RESOURCE_WARNING } from '@/configs/serverHealth';
import { createRandom, hashSeed, pickNumber } from './random';
import { NOW, stampAgo } from './today';

export const SERVER_ROLE_LABEL: Record<ServerRole, string> = {
  web: '웹 서버',
  was: '애플리케이션 서버',
  db: '데이터베이스',
  ai: 'AI 분석 서버',
  collector: '수집 서버',
};

export function resourceLevel(value: number): ResourceLevel {
  if (value >= RESOURCE_CRITICAL) return 'critical';
  if (value >= RESOURCE_WARNING) return 'warning';

  return 'normal';
}

/** 서버 한 대에서 가장 급한 지표의 등급 — 카드 테두리 색을 여기서 정한다. */
export function worstLevel(server: ServerNode): ResourceLevel {
  if (!server.up) return 'critical';

  const levels = [server.cpu, server.memory, server.disk].map(resourceLevel);

  if (levels.includes('critical')) return 'critical';
  if (levels.includes('warning')) return 'warning';

  return 'normal';
}

const SEEDS: { id: string; name: string; role: ServerRole; base: number; disk: number; up?: boolean }[] = [
  { id: 'SRV-WEB-01', name: 'WEB-01', role: 'web', base: 34, disk: 46 },
  { id: 'SRV-WEB-02', name: 'WEB-02', role: 'web', base: 31, disk: 44 },
  { id: 'SRV-WAS-01', name: 'WAS-01', role: 'was', base: 58, disk: 61 },
  { id: 'SRV-WAS-02', name: 'WAS-02', role: 'was', base: 62, disk: 59 },
  { id: 'SRV-DB-01', name: 'DB-01', role: 'db', base: 51, disk: 78 },
  // 학습 배치가 도는 시간대라 한 대는 일부러 위험 구간에 둔다.
  { id: 'SRV-AI-01', name: 'AI-01', role: 'ai', base: 91, disk: 67 },
  { id: 'SRV-COL-01', name: 'COL-01', role: 'collector', base: 44, disk: 52 },
];

function buildServers(): ServerNode[] {
  return SEEDS.map((seed) => {
    const next = createRandom(hashSeed(`server-${seed.id}`));
    const cpu = Math.round(Math.min(99, seed.base + pickNumber(next, -6, 6)));

    return {
      id: seed.id,
      name: seed.name,
      role: seed.role,
      up: seed.up ?? true,
      uptimeDays: Math.round(pickNumber(next, 12, 240)),
      cpu,
      memory: Math.round(Math.min(99, seed.base + pickNumber(next, -12, 14))),
      disk: seed.disk,
      networkMbps: Math.round(pickNumber(next, 40, 620)),
      // 24시간 추이 — 업무시간에 올라갔다 새벽에 내려온다.
      cpuTrend: Array.from({ length: 24 }, (_, hour) => {
        const office = hour >= 9 && hour <= 18 ? 1 : 0.62;

        return Math.max(3, Math.round(Math.min(99, cpu * office + pickNumber(next, -7, 7))));
      }),
    };
  });
}

export const SERVERS: ServerNode[] = buildServers();

export const DB_HEALTH: DbHealth = {
  connections: 128,
  maxConnections: 300,
  qps: 412,
  slowestSeconds: 2.4,
  storageUsed: 78,
  lastBackupAt: `${NOW.format('YYYY-MM-DD')} 03:10`,
  replicaLagSeconds: 1.2,
};

/** 아직 진행 중인 건은 지금 사용률을 그대로 쓴다 — 카드와 숫자가 어긋나면 안 된다. */
function currentValue(name: string, pick: (server: ServerNode) => number): number {
  const server = SERVERS.find((item) => item.name === name);

  return server ? pick(server) : 0;
}

export const RESOURCE_INCIDENTS: ResourceIncident[] = [
  {
    id: 'RI-2607',
    at: NOW.subtract(42, 'minute').format('YYYY-MM-DD HH:mm'),
    serverName: 'AI-01',
    metric: 'CPU',
    value: currentValue('AI-01', (server) => server.cpu),
    level: 'critical',
    note: '고장 예측 모델 재학습 배치가 돌고 있습니다.',
    resolvedAt: null,
  },
  {
    id: 'RI-2606',
    at: stampAgo(0, '09:14'),
    serverName: 'DB-01',
    metric: '디스크',
    value: currentValue('DB-01', (server) => server.disk),
    level: 'warning',
    note: '월간 통계 임시 테이블이 쌓였습니다. 정리 배치 예약함.',
    resolvedAt: null,
  },
  {
    id: 'RI-2605',
    at: stampAgo(2, '02:31'),
    serverName: 'WAS-02',
    metric: '메모리',
    value: 93,
    level: 'critical',
    note: '보고서 일괄 출력 요청이 몰렸습니다.',
    resolvedAt: stampAgo(2, '02:58'),
  },
  {
    id: 'RI-2604',
    at: stampAgo(6, '14:05'),
    serverName: 'COL-01',
    metric: '네트워크',
    value: 82,
    level: 'warning',
    note: '재송신 대기 건이 한꺼번에 빠져나갔습니다.',
    resolvedAt: stampAgo(6, '14:22'),
  },
];

/** 아직 풀리지 않은 임계 초과 — 화면 맨 위 경고 띠에 쓴다 (ECR-002-21). */
export const OPEN_INCIDENTS = RESOURCE_INCIDENTS.filter((item) => item.resolvedAt === null);
