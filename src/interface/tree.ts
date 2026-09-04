import type { OperationStatus } from './status';

export type NodeKind = 'root' | 'plant' | 'inverter' | 'string';

/**
 * 설비 계층의 한 칸. 전체 → 발전소 → 인버터 → 스트링
 *
 * 타입만 여기 두고 그래프를 만드는 값은 mocks/tree.ts 가 갖는다.
 * 고장코드 사전이 NodeKind 를 참조해야 해서, 목업끼리 순환 참조가 생기지 않도록 갈라 놓았다.
 */
export interface ScopeNode {
  id: string;
  kind: NodeKind;
  /** 그 계층 안에서의 이름 */
  name: string;
  /** 화면 제목에 쓸, 발전소부터 이어 붙인 이름 */
  fullName: string;
  capacityKw: number;
  status: OperationStatus;
  parentId: string | null;
  childIds: string[];
  /** 소속 발전소 id. 루트는 null */
  plantId: string | null;
  /** 소속 인버터 id. 발전소 이상 계층은 null */
  inverterId: string | null;
}
