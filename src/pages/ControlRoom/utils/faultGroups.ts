import { FAULT_BY_STATUS, getFaultCode } from '@/mocks/faultCodes';
import { OPERATION_RANK } from '@/mocks/status';
import type { OperationStatus } from '@/interface/status';
import type { School } from '@/interface/energy';

/** 묶어서 보여 줄 이상 상태 — 급한 순서는 화면 전체가 쓰는 우선순위를 따른다 */
const FAULT_STATUSES: OperationStatus[] = (['commLost', 'fault', 'degraded'] as OperationStatus[])
  .sort((a, b) => OPERATION_RANK[a] - OPERATION_RANK[b]);

export interface FaultGroup {
  status: OperationStatus;
  /** 그 상태에 걸린 발전소 — 설비가 큰 곳부터 */
  plants: School[];
  /** 묶음 전체의 추정 손실(kWh) */
  lossKwh: number;
  /** AI 진단이 이 상태에 붙이는 대표 원인 */
  reason: string;
}

/**
 * 오늘 정상 가동한 학교들이 설비 1kW 당 낸 발전량(kWh/kW).
 * 날씨·계절이 이미 반영된 값이라, 같은 날 다른 학교의 기대치를 잡는 잣대로 쓸 수 있다.
 */
function yieldPerKw(plants: School[]): number {
  const running = plants.filter((plant) => plant.status === 'running');
  const capacity = running.reduce((sum, plant) => sum + plant.capacityKw, 0);

  if (capacity <= 0) return 0;

  return running.reduce((sum, plant) => sum + plant.todayKwh, 0) / capacity;
}

/**
 * 추정 손실을 재는 자.
 *
 * 발전소마다 「얼마나 못 냈는가」를 저장해 두지 않으므로, 같은 날 정상 가동한 학교들이 낸 만큼
 * 냈다면 나왔을 양에서 실제를 뺀다. 어디까지나 추정이라 화면에도 그렇게 적는다.
 */
export function createLossEstimate(plants: School[]) {
  const perKw = yieldPerKw(plants);

  return (plant: School) => Math.max(0, plant.capacityKw * perKw - plant.todayKwh);
}

/**
 * 상태에 붙는 대표 원인 (SFR-011-05).
 * 통신이 끊긴 곳은 값 자체가 없어 무엇이 고장인지 판정할 수 없다 — 그 사실을 그대로 적는다.
 */
function reasonOf(status: OperationStatus): string {
  const codes = FAULT_BY_STATUS[status];

  if (status === 'commLost' || codes.length === 0) return '통신 두절로 원인 판정 불가';

  const [first, ...rest] = codes;
  const summary = getFaultCode(first)?.summary ?? '';

  return `코드${first} · ${summary}${rest.length > 0 ? ` 외 ${rest.length}종` : ''}`;
}

/** 이상 발전소를 상태별로 묶는다. 비어 있는 상태는 자리를 차지하지 않는다. */
export function buildFaultGroups(plants: School[]): FaultGroup[] {
  const lossOf = createLossEstimate(plants);

  return FAULT_STATUSES
    .map((status) => {
      // 같은 상태라면 설비가 큰 곳이 먼저다 — 멈춰 있는 동안 잃는 양이 그만큼 크다.
      const rows = plants
        .filter((plant) => plant.status === status)
        .sort((a, b) => b.capacityKw - a.capacityKw);

      return {
        status,
        plants: rows,
        lossKwh: rows.reduce((sum, plant) => sum + lossOf(plant), 0),
        reason: reasonOf(status),
      };
    })
    .filter((group) => group.plants.length > 0);
}
