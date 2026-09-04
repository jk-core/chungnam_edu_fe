import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getNode, getNodePath, hasNode } from '@/mocks/tree';
import { SCHOOLS } from '@/mocks/schools';
import type { ScopeNode } from '@/mocks/tree';

interface PlantState {
  /**
   * 조회 중인 발전소 id.
   * 새로고침·페이지 이동 뒤에도 남는 값은 이것뿐이다 — 인버터 아래까지 들고 다니면
   * 어느 화면에서 무엇을 보고 있는지 따라가기 어려워진다.
   */
  selectedPlantId: string;
  /**
   * 지금 화면에서 파고든 계층(인버터·스트링).
   * 저장하지 않으므로 다른 화면으로 옮기면 발전소 계층으로 되돌아간다.
   */
  selectedNodeId: string;
  selectNode: (id: string) => void;
  /** 발전소 계층으로 되돌린다. 화면을 옮길 때 호출한다. */
  resetDepth: () => void;
  /** 트리에서 펼쳐 둔 노드들 */
  expandedIds: string[];
  toggleExpanded: (id: string) => void;
  /** 특정 노드까지의 경로를 모두 펼친다. */
  expandPath: (ids: string[]) => void;
  /** 좌측 조회 대상 패널을 펼쳐 두었는지. 접으면 아래 메뉴가 위로 올라온다. */
  isScopeOpen: boolean;
  toggleScope: () => void;
}

/*
  조회는 늘 발전소 한 곳에서 시작한다.

  도 전체 합산 조회는 제공하지 않는다 — 300개 설비를 한 판에 접으면 카드도 차트도
  읽히지 않고, 요구사항이 말하는 조회 단위도 발전소부터다. 전체 집계가 필요한 자리는
  통합관제 상황판과 홈 지도가 따로 맡는다.
*/
const DEFAULT_PLANT_ID = SCHOOLS[0].id;

/** 저장값이 비었거나 없는 발전소를 가리키면 첫 발전소로 되돌린다. */
const plantOrDefault = (plantId: string | null | undefined) =>
  (plantId && hasNode(plantId) ? plantId : DEFAULT_PLANT_ID);

const usePlantStore = create<PlantState>()(
  persist(
    (set) => ({
      selectedPlantId: DEFAULT_PLANT_ID,
      selectedNodeId: DEFAULT_PLANT_ID,
      selectNode: (id) =>
        set((state) => {
          const candidate = hasNode(id) ? getNode(id) : null;
          // 루트(도 전체)를 가리키면 보고 있던 발전소에 그대로 머문다.
          const nodeId = candidate && candidate.kind !== 'root' ? candidate.id : state.selectedPlantId;

          // 어느 계층을 골랐든 소속 발전소를 함께 기억한다.
          // 트리는 고른 자리로 가는 길만 남긴다 — 형제를 갈아탈 때 앞서 펼쳐 둔 가지가
          // 그대로 남아 있으면 어디를 보고 있는지 흐려진다.
          return {
            selectedNodeId: nodeId,
            selectedPlantId: plantOrDefault(getNode(nodeId).plantId),
            expandedIds: getNodePath(nodeId).map((item) => item.id),
          };
        }),
      resetDepth: () =>
        set((state) => {
          const scopeId = state.selectedPlantId;

          // 이미 발전소 계층이면 그대로 둔다 — 불필요한 재렌더를 만들지 않는다.
          return state.selectedNodeId === scopeId ? state : { selectedNodeId: scopeId, expandedIds: [] };
        }),
      expandedIds: [],
      toggleExpanded: (id) =>
        set((state) => ({
          expandedIds: state.expandedIds.includes(id)
            ? state.expandedIds.filter((item) => item !== id)
            : [...state.expandedIds, id],
        })),
      expandPath: (ids) =>
        set((state) => ({
          expandedIds: [...new Set([...state.expandedIds, ...ids])],
        })),
      isScopeOpen: true,
      toggleScope: () => set((state) => ({ isScopeOpen: !state.isScopeOpen })),
    }),
    {
      name: 'cne-selected-node',
      storage: createJSONStorage(() => localStorage),
      // 발전소와 패널 접힘만 남긴다. 파고든 계층·트리 펼침은 화면을 옮기면 리셋된다.
      partialize: (state) => ({ selectedPlantId: state.selectedPlantId, isScopeOpen: state.isScopeOpen }),
      // 저장된 발전소가 있으면 그 계층에서 시작한다.
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        state.selectedPlantId = plantOrDefault(state.selectedPlantId);
        state.selectedNodeId = state.selectedPlantId;
      },
    },
  ),
);

export const useSelectedNodeId = () => usePlantStore((state) => state.selectedNodeId);

/** 지금 고른 발전소. 도 전체를 보고 있으면 null. */
export const useSelectedPlantId = () => usePlantStore((state) => state.selectedPlantId);

export const useSelectNode = () => usePlantStore((state) => state.selectNode);

export const useResetDepth = () => usePlantStore((state) => state.resetDepth);

export const useExpandedIds = () => usePlantStore((state) => state.expandedIds);

export const useToggleExpanded = () => usePlantStore((state) => state.toggleExpanded);

export const useExpandPath = () => usePlantStore((state) => state.expandPath);

export const useIsScopeOpen = () => usePlantStore((state) => state.isScopeOpen);

export const useToggleScope = () => usePlantStore((state) => state.toggleScope);

/** 지금 보고 있는 노드 */
export function useSelectedNode(): ScopeNode {
  return getNode(useSelectedNodeId());
}

export default usePlantStore;
