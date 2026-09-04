import type { NodeKind, ScopeNode } from '@/interface/tree';
import { INVERTERS } from './equipment';
import { REGION_TOTAL } from './regions';
import { SCHOOLS } from './schools';

export type { NodeKind, ScopeNode };

export const ROOT_ID = 'all';

/** 뿌리 노드의 이름. 조회 대상이 도 전체인지 이름으로 가려야 하는 곳이 쓴다. */
export const ROOT_LABEL = '충청남도 전체';

export const KIND_LABEL: Record<NodeKind, string> = {
  root: '전체',
  plant: '발전소',
  inverter: '인버터',
  string: '스트링',
};

function buildNodes(): Map<string, ScopeNode> {
  const nodes = new Map<string, ScopeNode>();

  nodes.set(ROOT_ID, {
    id: ROOT_ID,
    kind: 'root',
    name: ROOT_LABEL,
    fullName: ROOT_LABEL,
    capacityKw: REGION_TOTAL.capacityKw,
    status: 'running',
    parentId: null,
    childIds: SCHOOLS.map((school) => school.id),
    plantId: null,
    inverterId: null,
  });

  SCHOOLS.forEach((school) => {
    nodes.set(school.id, {
      id: school.id,
      kind: 'plant',
      name: school.name,
      fullName: school.name,
      capacityKw: school.capacityKw,
      status: school.status,
      parentId: ROOT_ID,
      childIds: [],
      plantId: school.id,
      inverterId: null,
    });
  });

  INVERTERS.forEach((inverter) => {
    const plant = nodes.get(inverter.schoolId);

    if (!plant) return;

    plant.childIds.push(inverter.id);

    const childIds: string[] = [];

    nodes.set(inverter.id, {
      id: inverter.id,
      kind: 'inverter',
      name: inverter.name,
      fullName: `${plant.name} ${inverter.name}`,
      capacityKw: inverter.capacityKw,
      status: inverter.status,
      parentId: plant.id,
      childIds,
      plantId: plant.id,
      inverterId: inverter.id,
    });

    inverter.strings.forEach((unit) => {
      childIds.push(unit.id);
      nodes.set(unit.id, {
        id: unit.id,
        kind: 'string',
        name: unit.name,
        fullName: `${plant.name} ${inverter.name} ${unit.name}`,
        capacityKw: unit.capacityKw,
        status: unit.status,
        parentId: inverter.id,
        childIds: [],
        plantId: plant.id,
        inverterId: inverter.id,
      });
    });
  });

  return nodes;
}

const NODE_BY_ID = buildNodes();

export function getNode(id: string | null | undefined): ScopeNode {
  return (id ? NODE_BY_ID.get(id) : undefined) ?? NODE_BY_ID.get(ROOT_ID)!;
}

export function hasNode(id: string | null | undefined): boolean {
  return Boolean(id && NODE_BY_ID.has(id));
}

export function getChildNodes(id: string): ScopeNode[] {
  return getNode(id).childIds.map((childId) => getNode(childId));
}

/** 루트에서 해당 노드까지의 경로. 브레드크럼처럼 쓴다. */
export function getNodePath(id: string): ScopeNode[] {
  const path: ScopeNode[] = [];
  let cursor: ScopeNode | undefined = getNode(id);

  while (cursor) {
    path.unshift(cursor);
    cursor = cursor.parentId ? getNode(cursor.parentId) : undefined;
  }

  return path;
}

/** 자식들이 무슨 계층인지 — "인버터별 발전" 같은 제목에 쓴다. */
export function childKindOf(node: ScopeNode): NodeKind | null {
  if (node.childIds.length === 0) return null;

  return getNode(node.childIds[0]).kind;
}
