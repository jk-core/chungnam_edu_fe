import { create } from 'zustand';
import { ROOT_ID, ROOT_LABEL } from '@/configs/scope';
import type { NodeKind, ScopeNode } from '@/interface/tree';

/*
  설비 계층을 담아 두는 자리.

  값은 API 가 채운다(`hooks/useScopeTree`). 스토어에 두는 것은 **React 밖에서도 동기로 읽어야**
  하기 때문이다 — 조회 대상 스토어의 `selectNode` 와 주소 동기화 구독이 렌더 바깥에서 노드를 본다.

  `version` 은 트리가 새로 깔릴 때마다 오른다. 목업 생성기들이 노드 id 만 키로 캐시를 들고 있어서,
  트리가 서기 전에 만든 값이 세션 내내 굳지 않도록 이 값을 캐시 키에 함께 섞는다.
*/

/** 트리가 서기 전에 돌려주는 자리표. 화면이 터지지 않게만 하고, 값으로 쓰이면 안 된다 */
const LOADING_ROOT: ScopeNode = {
  id: ROOT_ID,
  kind: 'root',
  name: ROOT_LABEL,
  fullName: ROOT_LABEL,
  capacityKw: 0,
  status: 'commLost',
  parentId: null,
  childIds: [],
  plantId: null,
  inverterId: null,
};

interface ScopeTreeState {
  nodes: Map<string, ScopeNode>;
  /** 발전소 목록이 도착해 뿌리와 발전소 한 단이 섰는가 */
  isReady: boolean;
  version: number;
  setNodes: (nodes: Map<string, ScopeNode>) => void;
}

const useScopeTreeStore = create<ScopeTreeState>()((set) => ({
  nodes: new Map(),
  isReady: false,
  version: 0,
  setNodes: (nodes) => set((state) => ({ nodes, isReady: true, version: state.version + 1 })),
}));

/* ── React 밖에서 부르는 자리 ───────────────────────────── */

export const setScopeTree = (nodes: Map<string, ScopeNode>) => useScopeTreeStore.getState().setNodes(nodes);

/** 트리가 섰는가. 목업 생성기는 이것이 false 인 동안 아무것도 짓지 않는다 */
export const isScopeTreeReady = () => useScopeTreeStore.getState().isReady;

/** 캐시 키에 섞는 값 — 트리가 새로 깔리면 앞서 만든 것을 다시 짓는다 */
export const scopeTreeVersion = () => useScopeTreeStore.getState().version;

export function getNode(id: string | null | undefined): ScopeNode {
  const { nodes } = useScopeTreeStore.getState();

  return (id ? nodes.get(id) : undefined) ?? nodes.get(ROOT_ID) ?? LOADING_ROOT;
}

export function hasNode(id: string | null | undefined): boolean {
  return Boolean(id && useScopeTreeStore.getState().nodes.has(id));
}

export function getChildNodes(id: string): ScopeNode[] {
  return getNode(id).childIds.map((childId) => getNode(childId));
}

/** 뿌리에서 해당 노드까지의 경로. 브레드크럼처럼 쓴다 */
export function getNodePath(id: string): ScopeNode[] {
  const path: ScopeNode[] = [];
  let cursor: ScopeNode | undefined = getNode(id);

  while (cursor) {
    path.unshift(cursor);
    cursor = cursor.parentId ? getNode(cursor.parentId) : undefined;
  }

  return path;
}

/** 자식들이 무슨 계층인지 — "인버터별 발전" 같은 제목에 쓴다 */
export function childKindOf(node: ScopeNode): NodeKind | null {
  if (node.childIds.length === 0) return null;

  return getNode(node.childIds[0]).kind;
}

/* ── 렌더 안에서 구독하는 자리 ──────────────────────────── */

export const useScopeTreeReady = () => useScopeTreeStore((state) => state.isReady);

/** 트리가 바뀔 때 다시 그려야 하는 화면이 구독한다 — 노드를 읽는 것은 위 접근자가 한다 */
export const useScopeTreeVersion = () => useScopeTreeStore((state) => state.version);

/** 노드 맵을 그대로 구독한다. 트리를 훑어 무언가를 짓는 memo 가 의존성으로 쓴다 */
export const useScopeTreeNodes = () => useScopeTreeStore((state) => state.nodes);

/** 맵에서 자식들을 편다 — memo 안에서 구독한 맵을 그대로 쓰려고 갈라 두었다 */
export const childrenOf = (nodes: Map<string, ScopeNode>, id: string): ScopeNode[] =>
  (nodes.get(id)?.childIds ?? []).flatMap((childId) => nodes.get(childId) ?? []);

export function useNode(id: string | null | undefined): ScopeNode {
  return useScopeTreeStore((state) => (id ? state.nodes.get(id) : undefined) ?? state.nodes.get(ROOT_ID) ?? LOADING_ROOT);
}

export default useScopeTreeStore;
