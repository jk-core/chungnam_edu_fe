import { useMemo } from 'react';
import { getSchoolById } from '@/mocks/schools';
import { useDeletedPlants } from '@/stores/assetStore';
import useEquipmentStore, { mergeInverterMasters, mergeModules } from '@/stores/equipmentStore';
import type { InverterMaster } from '@/interface/deviceMaster';

/** 표 한 줄 — 등록 정보에 발전소·모듈 이름을 붙인 것 */
export interface InverterRow extends InverterMaster {
  plantName: string;
  moduleName: string;
}

/** 고를 수 있는 모듈 제품. 인버터 등록이 이 목록에서 하나를 고른다 (SFR-016-01). */
export function useModuleProducts() {
  const moduleCreated = useEquipmentStore((state) => state.moduleCreated);
  const modulePatched = useEquipmentStore((state) => state.modulePatched);
  const moduleDeleted = useEquipmentStore((state) => state.moduleDeleted);

  return useMemo(
    () => mergeModules(moduleCreated, modulePatched, moduleDeleted),
    [moduleCreated, modulePatched, moduleDeleted],
  );
}

/** 인버터 목록. 지운 발전소의 설비는 함께 감춘다 (SFR-016-05). */
export function useInverterRows(): InverterRow[] {
  const inverterCreated = useEquipmentStore((state) => state.inverterCreated);
  const inverterPatched = useEquipmentStore((state) => state.inverterPatched);
  const inverterDeleted = useEquipmentStore((state) => state.inverterDeleted);
  const deletedPlants = useDeletedPlants();
  const modules = useModuleProducts();

  return useMemo(() => {
    const moduleById = new Map(modules.map((item) => [item.id, item]));

    return mergeInverterMasters(inverterCreated, inverterPatched, inverterDeleted)
      .filter((master) => !deletedPlants.includes(master.plantId))
      .map((master) => ({
        ...master,
        plantName: getSchoolById(master.plantId)?.name ?? master.plantId,
        moduleName: moduleById.get(master.moduleProductId)?.name ?? '모듈 미지정',
      }));
  }, [inverterCreated, inverterPatched, inverterDeleted, modules, deletedPlants]);
}
