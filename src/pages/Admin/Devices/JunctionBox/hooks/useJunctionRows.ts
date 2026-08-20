import { useMemo } from 'react';
import { getSchoolById } from '@/mocks/schools';
import { useDeletedPlants } from '@/stores/assetStore';
import useEquipmentStore, { mergeInverterMasters, mergeJunctions } from '@/stores/equipmentStore';
import type { JunctionBoxMaster } from '@/interface/deviceMaster';
import { useSelectableInverters } from '../../hooks/useSelectableInverters';

/** 표 한 줄 — 접속반 등록 정보에 소속 설비 이름을 붙인 것 */
export interface JunctionRow extends JunctionBoxMaster {
  plantName: string;
  inverterName: string;
}

/**
 * 접속반 목록.
 *
 * 지운 발전소에 딸린 것은 함께 감춘다 (SFR-016-05). 인버터만 지워진 접속반은 남겨
 * "삭제된 인버터"로 보여 준다 — 어딘가에 떠 있는 접속반을 눈에 띄게 두어야 정리할 수 있다.
 */
export function useJunctionRows(): JunctionRow[] {
  const junctionCreated = useEquipmentStore((state) => state.junctionCreated);
  const junctionPatched = useEquipmentStore((state) => state.junctionPatched);
  const junctionDeleted = useEquipmentStore((state) => state.junctionDeleted);
  const inverterCreated = useEquipmentStore((state) => state.inverterCreated);
  const inverterPatched = useEquipmentStore((state) => state.inverterPatched);
  const inverterDeleted = useEquipmentStore((state) => state.inverterDeleted);
  const deletedPlants = useDeletedPlants();
  const inverters = useSelectableInverters();

  return useMemo(() => {
    const byId = new Map(inverters.map((item) => [item.inverterId, item]));
    const hidden = new Set(
      mergeInverterMasters(inverterCreated, inverterPatched, inverterDeleted)
        .filter((item) => deletedPlants.includes(item.plantId))
        .map((item) => item.inverterId),
    );

    return mergeJunctions(junctionCreated, junctionPatched, junctionDeleted)
      .filter((box) => !hidden.has(box.inverterId))
      .map((box) => {
        const owner = byId.get(box.inverterId);

        return {
          ...box,
          plantName: getSchoolById(owner?.plantId ?? null)?.name ?? '소속 미지정',
          inverterName: owner?.name ?? '삭제된 인버터',
        };
      });
  }, [
    junctionCreated, junctionPatched, junctionDeleted,
    inverterCreated, inverterPatched, inverterDeleted,
    deletedPlants, inverters,
  ]);
}
