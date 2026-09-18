import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPowerPlantHierarchy, getPowerPlantList } from '@/service/powerPlant';
import { inverterNodeId, plantNodeId, ROOT_ID, ROOT_LABEL, serverIdOf, stringNodeId } from '@/configs/scope';
import { operationFromCode } from '@/mocks/status';
import { queryKeys } from '@/service/queryKeys';
import { setScopeTree } from '@/stores/scopeTreeStore';
import usePlantStore, { useSelectedPlantId } from '@/stores/plantStore';
import type { PowerPlantHierarchy, PowerPlantListItem } from '@/service/powerPlant/type';
import type { ScopeNode } from '@/interface/tree';

/*
  설비 계층을 두 조회로 짓는다.

  `/powerPlant/list` 가 뿌리와 발전소 한 단을, `/powerPlant/hierarchy` 가 **고른 발전소 한 곳의**
  인버터·스트링을 준다. 고르지 않은 발전소는 자식이 빈 채로 두고, 그 발전소로 옮겨갈 때 받는다.
*/
function buildNodes(plants: PowerPlantListItem[], hierarchy: PowerPlantHierarchy | undefined) {
  const nodes = new Map<string, ScopeNode>();

  nodes.set(ROOT_ID, {
    id: ROOT_ID,
    kind: 'root',
    name: ROOT_LABEL,
    fullName: ROOT_LABEL,
    capacityKw: plants.reduce((sum, plant) => sum + plant.powerPlantCapacity, 0),
    status: 'running',
    parentId: null,
    childIds: plants.map((plant) => plantNodeId(plant.powerPlantId)),
    plantId: null,
    inverterId: null,
  });

  plants.forEach((plant) => {
    const id = plantNodeId(plant.powerPlantId);

    nodes.set(id, {
      id,
      kind: 'plant',
      name: plant.powerPlantName,
      fullName: plant.powerPlantName,
      capacityKw: plant.powerPlantCapacity,
      status: operationFromCode(plant.statusCode),
      parentId: ROOT_ID,
      childIds: [],
      plantId: id,
      inverterId: null,
    });
  });

  const plantNode = hierarchy ? nodes.get(plantNodeId(hierarchy.powerPlantId)) : undefined;

  if (!hierarchy || !plantNode) return nodes;

  plantNode.childIds = hierarchy.inverterList.map((inverter) => inverterNodeId(inverter.cid));

  hierarchy.inverterList.forEach((inverter) => {
    const inverterId = inverterNodeId(inverter.cid);

    nodes.set(inverterId, {
      id: inverterId,
      kind: 'inverter',
      name: inverter.equipmentName,
      fullName: `${plantNode.name} ${inverter.equipmentName}`,
      capacityKw: inverter.equipmentCapacity,
      status: operationFromCode(inverter.statusCode),
      parentId: plantNode.id,
      childIds: inverter.stringList.map((unit) => stringNodeId(unit.stringId)),
      plantId: plantNode.id,
      inverterId,
      phaseTypeCode: inverter.phaseTypeCode,
    });

    inverter.stringList.forEach((unit) => {
      const id = stringNodeId(unit.stringId);

      nodes.set(id, {
        id,
        kind: 'string',
        name: unit.stringName,
        fullName: `${plantNode.name} ${inverter.equipmentName} ${unit.stringName}`,
        capacityKw: unit.stringCapacity,
        status: operationFromCode(unit.statusCode),
        parentId: inverterId,
        childIds: [],
        plantId: plantNode.id,
        inverterId,
      });
    });
  });

  return nodes;
}

/**
 * 트리를 받아 스토어에 깐다. 앱에서 **한 번만** 부른다 (`RootLayout`).
 *
 * 노드를 읽는 것은 `stores/scopeTreeStore` 의 접근자다 — 렌더 밖에서도 읽어야 하는 자리가 있어
 * 값을 훅으로 돌려주지 않는다.
 */
export function useScopeTree() {
  const selectedPlantId = useSelectedPlantId();
  const powerPlantId = serverIdOf(selectedPlantId, 'p');

  const { data: plants } = useQuery({
    queryKey: queryKeys.powerPlant.list(),
    queryFn: getPowerPlantList,
    // 도 전체를 한 번에 받아 화면이 그 위에서 거른다 — 자주 다시 받을 값이 아니다.
    staleTime: 5 * 60 * 1000,
  });

  const { data: hierarchy } = useQuery({
    queryKey: queryKeys.powerPlant.hierarchy(powerPlantId),
    queryFn: () => getPowerPlantHierarchy(powerPlantId ?? 0),
    enabled: powerPlantId !== null,
  });

  useEffect(() => {
    if (!plants) return;

    setScopeTree(buildNodes(plants, hierarchy));
  }, [plants, hierarchy]);

  /*
    담아 둔 발전소가 목록에 없으면(첫 방문이거나 사라진 발전소) 첫 발전소로 옮긴다.
    목록이 오기 전에는 되돌릴 자리를 몰라 아무것도 하지 않는다.
  */
  useEffect(() => {
    if (!plants || plants.length === 0) return;

    const exists = plants.some((plant) => plantNodeId(plant.powerPlantId) === selectedPlantId);

    if (exists) return;

    usePlantStore.getState().selectNode(plantNodeId(plants[0].powerPlantId));
  }, [plants, selectedPlantId]);
}
