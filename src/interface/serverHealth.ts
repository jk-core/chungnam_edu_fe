/** 서버 한 대의 역할 (ECR-002-20, ECR-003-13) */
export type ServerRole = 'web' | 'was' | 'db' | 'ai' | 'collector';

/** 자원 사용률로 매긴 상태 — 임계선을 넘으면 곧바로 눈에 띄어야 한다 (ECR-002-21) */
export type ResourceLevel = 'normal' | 'warning' | 'critical';

/** 지금 이 순간의 서버 상태 */
export interface ServerNode {
  id: string;
  name: string;
  role: ServerRole;
  /** 가동 중인지 — 꺼져 있으면 사용률은 뜻이 없다 */
  up: boolean;
  /** 연속 가동 일수 */
  uptimeDays: number;
  /** 사용률(0~100) */
  cpu: number;
  memory: number;
  disk: number;
  /** 초당 송수신량(Mbps) */
  networkMbps: number;
  /** 최근 24시간 CPU 사용률 추이 */
  cpuTrend: number[];
}

/** 자원 임계 초과 기록 (ECR-002-21) */
export interface ResourceIncident {
  id: string;
  at: string;
  serverName: string;
  metric: string;
  value: number;
  level: ResourceLevel;
  note: string;
  /** 아직 풀리지 않았으면 null */
  resolvedAt: string | null;
}

/** DB 상태 (ECR-003-13) */
export interface DbHealth {
  /** 연결 수 */
  connections: number;
  maxConnections: number;
  /** 초당 질의 수 */
  qps: number;
  /** 가장 오래 걸린 질의(초) */
  slowestSeconds: number;
  /** 테이블스페이스 사용률(0~100) */
  storageUsed: number;
  /** 마지막 백업 시각 */
  lastBackupAt: string;
  /** 복제 지연(초) */
  replicaLagSeconds: number;
}
