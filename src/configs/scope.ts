import type { NodeKind } from '@/interface/tree';

/*
  설비 계층의 고정값.

  트리를 무엇으로 짓든(목업이든 API 든) 변하지 않는 것만 둔다 — 뿌리 노드의 자리와 계층 이름이다.
  값을 짓는 쪽에 두면 목업을 걷어낼 때 이 상수를 쓰는 화면들이 함께 딸려 온다.
*/

export const ROOT_ID = 'all';

/** 뿌리 노드의 이름. 조회 대상이 도 전체인지 이름으로 가려야 하는 곳이 쓴다. */
export const ROOT_LABEL = '충청남도 전체';

export const KIND_LABEL: Record<NodeKind, string> = {
  root: '전체',
  plant: '발전소',
  inverter: '인버터',
  string: '스트링',
};

/*
  API 가 주는 식별자는 계층마다 1 부터 매겨진 숫자라, 한 맵에 담으면 발전소 1 번과 인버터 1 번이
  부딪힌다. 계층을 접두로 붙여 갈라 둔다.
*/
export const plantNodeId = (powerPlantId: number) => `p:${powerPlantId}`;

export const inverterNodeId = (cid: number) => `i:${cid}`;

export const stringNodeId = (stringId: number) => `s:${stringId}`;

/** 노드 id 에서 서버 식별자를 되꺼낸다. 접두가 다르면 null — 목업 id 가 섞여 들어와도 터지지 않는다 */
export function serverIdOf(nodeId: string, prefix: 'p' | 'i' | 's'): number | null {
  if (!nodeId.startsWith(`${prefix}:`)) return null;

  const value = Number(nodeId.slice(2));

  return Number.isFinite(value) ? value : null;
}
