import type { BadgeTone } from '@/components/common/Badge';
import type { OperationStatus, RtuStatus, Severity } from '@/interface/status';

/**
 * 상태 메타의 단일 출처.
 * 라벨·색·정렬 순서·발전량 계수를 여기 모아, 화면마다 따로 정의하는 일이 없게 한다.
 */
export const OPERATION_LABEL: Record<OperationStatus, string> = {
  running: '정상',
  ready: '준비중',
  degraded: '주의',
  fault: '경고',
  commLost: '통신단절',
};

/**
 * 연계 시스템이 주고받는 상태 코드.
 *
 * 화면에는 쓰지 않는다 — 값을 읽고 쓰는 경계에서만 라벨과 맞바꾼다.
 * 목업이 상태를 문자열 키로 다루는 지금은 쓰이는 곳이 없지만, 실제 API 로 넘어가면
 * 이 표가 응답을 `OperationStatus` 로 옮기는 유일한 지점이 된다.
 */
export const OPERATION_CODE: Record<OperationStatus, string> = {
  ready: '7001',
  running: '7002',
  degraded: '7003',
  fault: '7004',
  commLost: '7998',
};

const STATUS_BY_CODE = new Map<string, OperationStatus>(
  (Object.entries(OPERATION_CODE) as [OperationStatus, string][]).map(([status, code]) => [code, status]),
);

/**
 * 연계 코드를 상태로 옮긴다.
 * 표에 없는 코드는 통신단절로 본다 — 모르는 값을 정상으로 삼으면 이상 설비가 조용히 묻힌다.
 */
export function operationFromCode(code: string | null | undefined): OperationStatus {
  return (code ? STATUS_BY_CODE.get(code.trim()) : undefined) ?? 'commLost';
}

/** 상태를 한 줄로 풀어 쓴 설명 — 범례와 도움말에서 쓴다. */
export const OPERATION_DESCRIPTION: Record<OperationStatus, string> = {
  running: '기대 출력 범위 안에서 정상 발전하고 있습니다.',
  ready: '설치를 마쳤지만 아직 정상 수집 이력이 없습니다.',
  degraded: '맑은 시간대에도 기대보다 출력이 낮습니다.',
  fault: '회로 이상으로 출력이 크게 떨어졌습니다.',
  commLost: '계측값이 들어오지 않아 발전 여부를 확인할 수 없습니다.',
};

export const OPERATION_TONE: Record<OperationStatus, BadgeTone> = {
  running: 'ok',
  ready: 'brand',
  degraded: 'caution',
  fault: 'critical',
  commLost: 'offline',
};

export const OPERATION_TO_SEVERITY: Record<OperationStatus, Severity> = {
  running: 'info',
  ready: 'info',
  degraded: 'caution',
  fault: 'critical',
  commLost: 'critical',
};

/** 이상한 것을 앞세우는 정렬 순서 */
export const OPERATION_RANK: Record<OperationStatus, number> = {
  commLost: 0,
  fault: 1,
  degraded: 2,
  ready: 3,
  running: 4,
};

/** 상태가 발전량을 깎는 계수 */
export const OPERATION_PENALTY: Record<OperationStatus, number> = {
  running: 1,
  ready: 0,
  degraded: 0.86,
  fault: 0.72,
  commLost: 0,
};

/** 화면에 늘어놓는 기본 순서 (정상 → 이상) */
export const OPERATION_ORDER: OperationStatus[] = ['running', 'ready', 'degraded', 'fault', 'commLost'];

/** 계측값이 잡히는 상태인지. 준비중·통신단절은 발전량이 0 이다. */
export const isProducing = (status: OperationStatus) => status !== 'ready' && status !== 'commLost';

/** 이상으로 볼 상태인지. 준비중은 고장이 아니다. */
export const isAbnormal = (status: OperationStatus) =>
  status === 'degraded' || status === 'fault' || status === 'commLost';

/** 빈 집계 그릇 — 상태가 늘어도 초기값을 빠뜨리지 않게 팩토리로 둔다. */
export const emptyOperationCount = (): Record<OperationStatus, number> => ({
  running: 0,
  ready: 0,
  degraded: 0,
  fault: 0,
  commLost: 0,
});

export function countOperation<T extends { status: OperationStatus }>(items: T[]): Record<OperationStatus, number> {
  return items.reduce<Record<OperationStatus, number>>(
    (acc, item) => ({ ...acc, [item.status]: acc[item.status] + 1 }),
    emptyOperationCount(),
  );
}

// ── RTU·환경센서 연계 상태 ─────────────────────────────────
export const RTU_LABEL: Record<RtuStatus, string> = {
  normal: '정상',
  abnormal: '비정상',
  disconnected: '미연결',
};

export const RTU_TONE: Record<RtuStatus, BadgeTone> = {
  normal: 'ok',
  abnormal: 'caution',
  disconnected: 'offline',
};

export const RTU_ORDER: RtuStatus[] = ['normal', 'abnormal', 'disconnected'];

export const emptyRtuCount = (): Record<RtuStatus, number> => ({
  normal: 0,
  abnormal: 0,
  disconnected: 0,
});

/**
 * 인버터 표시 상태.
 * RTU 가 끊겨 있으면 인버터가 무엇을 하고 있든 계측값이 없으므로 통신단절로 본다 (SFR-009-03).
 */
export function deriveOperation(own: OperationStatus, rtuStatus: RtuStatus): OperationStatus {
  if (rtuStatus === 'disconnected') return 'commLost';

  return own;
}
