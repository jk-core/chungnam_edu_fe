import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getNode, hasNode, ROOT_ID } from '@/mocks/tree';
import type { ScopeNode } from '@/mocks/tree';

interface PlantState {
  /**
   * 조회 중인 발전소 id. null 이면 도 전체다.
   * 새로고침·페이지 이동 뒤에도 남는 값은 이것뿐이다 — 인버터 아래까지 들고 다니면
   * 어느 화면에서 무엇을 보고 있는지 따라가기 어려워진다.
   */
  selectedPlantId: string | null;
  /**
   * 지금 화면에서 파고든 계층(인버터·접속반·스트링·채널).
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

/** 발전소 계층 노드 id. 도 전체면 루트. */
const plantScopeOf = (plantId: string | null) => plantId ?? ROOT_ID;

const usePlantStore = create<PlantState>()(
  persist(
    (set) => ({
      selectedPlantId: null,
      selectedNodeId: ROOT_ID,
      selectNode: (id) =>
        set(() => {
          const nodeId = hasNode(id) ? id : ROOT_ID;

          // 어느 계층을 골랐든 소속 발전소를 함께 기억한다. 루트를 고르면 도 전체로 돌아간다.
          return { selectedNodeId: nodeId, selectedPlantId: getNode(nodeId).plantId };
        }),
      resetDepth: () =>
        set((state) => {
          const scopeId = plantScopeOf(state.selectedPlantId);

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

        const plantId = state.selectedPlantId;

        state.selectedPlantId = plantId !== null && hasNode(plantId) ? plantId : null;
        state.selectedNodeId = plantScopeOf(state.selectedPlantId);
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
