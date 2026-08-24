import { useMemo } from 'react';
import { useDeletedPlants } from '@/stores/assetStore';
import useEquipmentStore, { mergePyranometers } from '@/stores/equipmentStore';
import type { Pyranometer } from '@/interface/deviceMaster';

/**
 * 일사량계 목록. 지운 발전소의 장비는 함께 감춘다 (SFR-016-05).
 * 목록과 폼이 같은 목록을 봐야 해서 — 폼은 주소의 식별자로 여기서 자기 줄을 찾는다.
 */
export function usePyranometerRows(): Pyranometer[] {
  const pyranometerCreated = useEquipmentStore((state) => state.pyranometerCreated);
  const pyranometerPatched = useEquipmentStore((state) => state.pyranometerPatched);
  const pyranometerDeleted = useEquipmentStore((state) => state.pyranometerDeleted);
  const deletedPlants = useDeletedPlants();

  return useMemo(
    () => mergePyranometers(pyranometerCreated, pyranometerPatched, pyranometerDeleted)
      .filter((row) => !deletedPlants.includes(row.plantId)),
    [pyranometerCreated, pyranometerPatched, pyranometerDeleted, deletedPlants],
  );
}
