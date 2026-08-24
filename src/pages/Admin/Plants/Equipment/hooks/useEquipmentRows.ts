import { useMemo } from 'react';
import { getSchoolById } from '@/mocks/schools';
import { useDeletedPlants } from '@/stores/assetStore';
import { useInverterProducts } from '@/pages/Admin/_shared/device/useSelectableEquipment';
import useEquipmentStore, { mergeEquipment, mergeModules } from '@/stores/equipmentStore';
import type { EquipmentMaster, InverterKind } from '@/interface/deviceMaster';

/** 표 한 줄 — 등록 정보에 발전소·제품 이름을 붙인 것 */
export interface EquipmentRow extends EquipmentMaster {
  plantName: string;
  moduleName: string;
  inverterName: string;
  inverterMaker: string;
  /** 고른 인버터 제품의 타입. 스트링 구조를 다룰 수 있는지가 여기서 갈린다 */
  inverterKind: InverterKind | null;
}

/** 고를 수 있는 모듈 제품. 설비 등록이 이 목록에서 하나를 고른다 (SFR-016-01). */
export function useModuleProducts() {
  const moduleCreated = useEquipmentStore((state) => state.moduleCreated);
  const modulePatched = useEquipmentStore((state) => state.modulePatched);
  const moduleDeleted = useEquipmentStore((state) => state.moduleDeleted);

  return useMemo(
    () => mergeModules(moduleCreated, modulePatched, moduleDeleted),
    [moduleCreated, modulePatched, moduleDeleted],
  );
}

/** 설비 목록. 지운 발전소의 설비는 함께 감춘다 (SFR-016-05). */
export function useEquipmentRows(): EquipmentRow[] {
  const equipmentCreated = useEquipmentStore((state) => state.equipmentCreated);
  const equipmentPatched = useEquipmentStore((state) => state.equipmentPatched);
  const equipmentDeleted = useEquipmentStore((state) => state.equipmentDeleted);
  const deletedPlants = useDeletedPlants();
  const modules = useModuleProducts();
  const inverters = useInverterProducts();

  return useMemo(() => {
    const moduleById = new Map(modules.map((item) => [item.id, item]));
    const inverterById = new Map(inverters.map((item) => [item.id, item]));

    return mergeEquipment(equipmentCreated, equipmentPatched, equipmentDeleted)
      .filter((master) => !deletedPlants.includes(master.plantId))
      .map((master) => {
        const inverter = inverterById.get(master.inverterProductId);

        return {
          ...master,
          plantName: getSchoolById(master.plantId)?.name ?? master.plantId,
          moduleName: moduleById.get(master.moduleProductId)?.name ?? '모듈 미지정',
          inverterName: inverter?.name ?? '인버터 미지정',
          inverterMaker: inverter?.maker ?? '',
          inverterKind: inverter?.kind ?? null,
        };
      });
  }, [equipmentCreated, equipmentPatched, equipmentDeleted, modules, inverters, deletedPlants]);
}
