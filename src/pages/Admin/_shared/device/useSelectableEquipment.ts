import { useMemo } from 'react';
import { useDeletedPlants } from '@/stores/assetStore';
import useEquipmentStore, { mergeEquipment, mergeInverterProducts } from '@/stores/equipmentStore';
import type { InverterKind } from '@/interface/deviceMaster';

/**
 * 아래 장비를 물릴 수 있는 설비. 지운 발전소의 설비는 고를 수 없다 (SFR-016-05).
 *
 * `kind` 를 주면 그 기종의 설비만 남긴다 — 스트링은 스트링 인버터에만 달린다.
 * 가리지 않으면 스트링 목록에 스트링을 가질 수 없는 설비가 0조인 채로 줄줄이 서서,
 * 등록할 수 없는 줄을 눌러 보게 된다.
 */
export function useSelectableEquipment(kind?: InverterKind) {
  const equipmentCreated = useEquipmentStore((state) => state.equipmentCreated);
  const equipmentPatched = useEquipmentStore((state) => state.equipmentPatched);
  const equipmentDeleted = useEquipmentStore((state) => state.equipmentDeleted);
  const inverterCreated = useEquipmentStore((state) => state.inverterCreated);
  const inverterPatched = useEquipmentStore((state) => state.inverterPatched);
  const inverterDeleted = useEquipmentStore((state) => state.inverterDeleted);
  const deletedPlants = useDeletedPlants();

  return useMemo(() => {
    const kindOf = new Map(
      mergeInverterProducts(inverterCreated, inverterPatched, inverterDeleted)
        .map((product) => [product.id, product.kind]),
    );

    return mergeEquipment(equipmentCreated, equipmentPatched, equipmentDeleted)
      .filter((item) => !deletedPlants.includes(item.plantId))
      .filter((item) => !kind || kindOf.get(item.inverterProductId) === kind);
  }, [
    equipmentCreated, equipmentPatched, equipmentDeleted,
    inverterCreated, inverterPatched, inverterDeleted,
    deletedPlants, kind,
  ]);
}

/** 인버터 제품 카탈로그. 설비 폼과 제품 관리 화면이 같은 목록을 본다. */
export function useInverterProducts() {
  const inverterCreated = useEquipmentStore((state) => state.inverterCreated);
  const inverterPatched = useEquipmentStore((state) => state.inverterPatched);
  const inverterDeleted = useEquipmentStore((state) => state.inverterDeleted);

  return useMemo(
    () => mergeInverterProducts(inverterCreated, inverterPatched, inverterDeleted),
    [inverterCreated, inverterPatched, inverterDeleted],
  );
}
