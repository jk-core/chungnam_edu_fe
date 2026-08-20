import { useMemo } from 'react';
import { useDeletedPlants } from '@/stores/assetStore';
import useEquipmentStore, { mergeInverterMasters } from '@/stores/equipmentStore';

/**
 * 아래 장비를 물릴 수 있는 인버터. 지운 발전소의 설비는 고를 수 없다 (SFR-016-05).
 * 접속반·스트링이 같은 규칙을 봐야 해서 장비 관리 아래 공용으로 둔다.
 */
export function useSelectableInverters() {
  const inverterCreated = useEquipmentStore((state) => state.inverterCreated);
  const inverterPatched = useEquipmentStore((state) => state.inverterPatched);
  const inverterDeleted = useEquipmentStore((state) => state.inverterDeleted);
  const deletedPlants = useDeletedPlants();

  return useMemo(
    () => mergeInverterMasters(inverterCreated, inverterPatched, inverterDeleted)
      .filter((item) => !deletedPlants.includes(item.plantId)),
    [inverterCreated, inverterPatched, inverterDeleted, deletedPlants],
  );
}
