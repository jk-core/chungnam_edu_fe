import { REGION_TOTAL } from '@/mocks/regions';
import { getInverterById } from '@/mocks/equipment';
import { getSchoolById } from '@/mocks/schools';
import { useSelectedNode } from '@/stores/plantStore';
import type { Inverter } from '@/interface/equipment';
import type { School } from '@/interface/energy';
import type { ScopeNode } from '@/mocks/tree';

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
  /**
   * 도 전체 수치를 선택 대상 몫으로 환산할 때 곱하는 값.
   * 설비용량 비율을 그대로 쓴다.
   */
  factor: number;
}

export function usePlantScope(): PlantScope {
  const node = useSelectedNode();
  const plant = getSchoolById(node.plantId);
  const inverter = getInverterById(node.inverterId);

  return {
    node,
    plant,
    inverter,
    label: node.fullName,
    plantLabel: plant?.name ?? '',
    factor: node.capacityKw / REGION_TOTAL.capacityKw,
  };
}
