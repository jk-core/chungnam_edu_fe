import { z } from 'zod';

/**
 * 서버 한 대씩의 지금 상태와 최근 24시간 CPU 추이.
 *
 * 요약 카드 세 장(가동 서버·평균 CPU·최고 CPU)은 이 배열에서 프론트가 센다 — 따로 주지 않는다.
 * 주의·위험 임계선도 프론트가 정한다 — 응답에 싣지 않는다.
 */
export type ManageServerHealth = z.infer<typeof manageServerHealthSchema>;
export const manageServerHealthSchema = z.object({
  serverId: z.string(),
  serverName: z.string(),
  serverRoleCode: z.number().int(),
  serverRoleName: z.string(),
  isUp: z.boolean(),
  uptimeDay: z.number().int(),
  cpuRate: z.number(),
  memoryRate: z.number(),
  diskRate: z.number(),
  /** 초당송수신량(Mbps) */
  networkMbps: z.number(),
  flowChartData: z.array(z.object({
    dateTime: z.string(),
    /** 미수집이면 null */
    cpuRate: z.number().nullable(),
  })),
});

/** 데이터베이스 한 벌의 상태 */
export type ManageServerHealthDatabase = z.infer<typeof manageServerHealthDatabaseSchema>;
export const manageServerHealthDatabaseSchema = z.object({
  connectionCount: z.number().int(),
  maxConnectionCount: z.number().int(),
  queryPerSecond: z.number(),
  slowestQuerySecond: z.number(),
  storageRate: z.number(),
  lastBackupDtm: z.string(),
  replicaLagSecond: z.number(),
});

/**
 * 임계 초과 이력. 조회 조건이 없어 전체를 한 번에 준다.
 *
 * 등급은 서버가 정해 내려준다 — 프론트가 metricValue 로 다시 판정하지 않는다. 지표마다 단위가
 * 달라(사용률은 %, 네트워크는 Mbps) 한 임계선으로 잴 수 없다.
 * 아직 풀리지 않은 건은 resolveDtm 이 null 이다 — 표가 그 줄을 붉게 세운다.
 */
export type ManageServerHealthIncident = z.infer<typeof manageServerHealthIncidentSchema>;
export const manageServerHealthIncidentSchema = z.object({
  incidentId: z.number().int(),
  occurDtm: z.string(),
  serverId: z.string(),
  serverName: z.string(),
  metricName: z.string(),
  metricValue: z.number(),
  metricUnit: z.string(),
  levelCode: z.number().int(),
  levelName: z.string(),
  note: z.string(),
  resolveDtm: z.string().nullable(),
});
