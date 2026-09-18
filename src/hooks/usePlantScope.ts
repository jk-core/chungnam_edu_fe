import { useMemo } from 'react';
import { childrenOf, useScopeTreeNodes } from '@/stores/scopeTreeStore';
import { inverterFromNode } from '@/mocks/equipment';
import { usePowerPlantById } from '@/hooks/usePowerPlantList';
import { useSelectedNode } from '@/stores/plantStore';
import type { Inverter } from '@/interface/equipment';
import type { School } from '@/interface/energy';
import type { ScopeNode } from '@/interface/tree';

export interface PlantScope {
  /** 지금 보고 있는 계층 노드 */
  node: ScopeNode;
  /** 소속 발전소. 조회는 늘 발전소 한 곳에서 시작한다. */
  plant: School | null;
  /** 소속 인버터. 발전소 이상 계층이면 null. */
  inverter: Inverter | null;
  /** 화면 문구에 쓸 대상 이름. 계층이 깊어지면 앞 계층이 함께 붙는다. */
  label: string;
  /** 발전소 단위까지만 다루는 화면이 쓰는 이름 */
  plantLabel: string;
}

/** 계층 응답이 준 인버터 한 대를 화면이 쓰는 설비로 편다 */
export function useInverterOf(inverterNodeId: string | null): Inverter | null {
  const nodes = useScopeTreeNodes();

  return useMemo(() => {
    const node = inverterNodeId ? nodes.get(inverterNodeId) : undefined;

    if (!node || node.kind !== 'inverter') return null;

    return inverterFromNode(node, childrenOf(nodes, node.id));
  }, [inverterNodeId, nodes]);
}

/** 발전소에 달린 인버터 전부. 계층을 아직 안 받았으면 빈 배열이다 */
export function useInvertersOf(plantNodeId: string | null): Inverter[] {
  const nodes = useScopeTreeNodes();

  return useMemo(() => {
    if (!plantNodeId) return [];

    return childrenOf(nodes, plantNodeId)
      .filter((child) => child.kind === 'inverter')
      .map((child) => inverterFromNode(child, childrenOf(nodes, child.id)));
  }, [plantNodeId, nodes]);
}

export function usePlantScope(): PlantScope {
  const node = useSelectedNode();
  const plant = usePowerPlantById(node.plantId);
  const inverter = useInverterOf(node.inverterId);

  return {
    node,
    plant,
    inverter,
    label: node.fullName,
    plantLabel: plant?.name ?? '',
  };
}
