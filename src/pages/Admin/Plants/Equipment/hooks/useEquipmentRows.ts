import { useMemo } from 'react';
import { getSchoolById } from '@/mocks/schools';
import { useDeletedPlants } from '@/stores/assetStore';
import { useInverterCatalog, useModuleCatalog } from '@/hooks/useProductCatalog';
import useEquipmentStore, { mergeEquipment } from '@/stores/equipmentStore';
import type { EquipmentMaster } from '@/interface/deviceMaster';
import type { InverterTypeCode } from '@/configs/codes';

/** 표 한 줄 — 등록 정보에 발전소·제품 이름을 붙인 것 */
export interface EquipmentRow extends EquipmentMaster {
  plantName: string;
  moduleName: string;
  inverterName: string;
  inverterMaker: string;
  /** 고른 인버터 제품의 타입. 스트링 구조를 다룰 수 있는지가 여기서 갈린다 */
  inverterTypeCode: InverterTypeCode | null;
  inverterTypeName: string;
}

/** 설비 목록. 지운 발전소의 설비는 함께 감춘다 (SFR-016-05). */
export function useEquipmentRows(): EquipmentRow[] {
  const equipmentCreated = useEquipmentStore((state) => state.equipmentCreated);
  const equipmentPatched = useEquipmentStore((state) => state.equipmentPatched);
  const equipmentDeleted = useEquipmentStore((state) => state.equipmentDeleted);
  const deletedPlants = useDeletedPlants();
  const modules = useModuleCatalog();
  const inverters = useInverterCatalog();

  return useMemo(() => {
    const moduleById = new Map(modules.map((item) => [item.moduleId, item]));
    const inverterById = new Map(inverters.map((item) => [item.inverterId, item]));

    return mergeEquipment(equipmentCreated, equipmentPatched, equipmentDeleted)
      .filter((master) => !deletedPlants.includes(master.plantId))
      .map((master) => {
        const inverter = inverterById.get(master.inverterProductId);

        return {
          ...master,
          plantName: getSchoolById(master.plantId)?.name ?? master.plantId,
          moduleName: moduleById.get(master.moduleProductId)?.moduleName ?? '모듈 미지정',
          inverterName: inverter?.inverterName ?? '인버터 미지정',
          inverterMaker: inverter?.inverterEnterpriseName ?? '',
          inverterTypeCode: inverter?.inverterTypeCode ?? null,
          inverterTypeName: inverter?.inverterTypeCodeName ?? '',
        };
      });
  }, [equipmentCreated, equipmentPatched, equipmentDeleted, modules, inverters, deletedPlants]);
}
