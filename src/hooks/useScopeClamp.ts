import { useEffect } from 'react';
import { useAuthUser } from '@/stores/authStore';
import { useSelectedNode, useSelectNode } from '@/stores/plantStore';

/**
 * 교육기관 계정의 조회 범위를 담당 발전소로 묶는다 (SFR-023-03).
 * persist 된 이전 선택이 권한 밖일 수 있으므로, 로그인 직후와 계정 전환 때 담당 발전소로 되돌린다.
 */
export function useScopeClamp() {
  const user = useAuthUser();
  const node = useSelectedNode();
  const selectNode = useSelectNode();

  useEffect(() => {
    if (!user || user.plantIds.length === 0) return;

    const outOfScope = node.kind === 'root' || (node.plantId !== null && !user.plantIds.includes(node.plantId));

    if (outOfScope) selectNode(user.plantIds[0]);
  }, [user, node.kind, node.plantId, selectNode]);
}

/** 지금 계정이 조회할 수 있는 발전소 id 목록. 비어 있으면 제한 없음. */
export function useAllowedPlantIds(): string[] {
  const user = useAuthUser();

  return user?.plantIds ?? [];
}
