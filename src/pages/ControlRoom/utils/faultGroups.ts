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
  /** AI 진단이 이 상태에 붙이는 대표 원인 */
  reason: string;
}

/*
  추정 손실(정상 가동 학교의 kW 당 발전량으로 환산한 부족분)은 걷어냈다 —
  진단 정확도가 받쳐 주지 못하는 수치를 상황판에 적으면 곧바로 조치 요구로 이어진다
  (2026-08-21 회의). 되살릴 일이 생기면 git 이력에 계산식이 남아 있다.
*/

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
  return FAULT_STATUSES
    .map((status) => {
      // 같은 상태라면 설비가 큰 곳이 먼저다 — 멈춰 있는 동안 잃는 양이 그만큼 크다.
      const rows = plants
        .filter((plant) => plant.status === status)
        .sort((a, b) => b.capacityKw - a.capacityKw);

      return { status, plants: rows, reason: reasonOf(status) };
    })
    .filter((group) => group.plants.length > 0);
}
