import { useCallback, useMemo } from 'react';
import { REGION_CODES, regionNameOfCode } from '@/mocks/manageCodes';
import { REGIONS } from '@/mocks/regions';
import { SCHOOLS } from '@/mocks/schools';
import useAssetStore, { mergeAsset, mergeUsers } from '@/stores/assetStore';
import useEquipmentStore, { mergeEquipment } from '@/stores/equipmentStore';
import type { PlantAsset } from '@/interface/asset';
import type { School } from '@/interface/energy';

/** Select 에서 '지정 안 함'을 나타내는 값 */
export const NONE = '';

export const REGION_OPTIONS = REGION_CODES.map((item) => ({ value: item.regionCode, label: item.name }));

/** 빈 값을 서버가 쓰는 null 로 되돌린다. */
export function toId(value: string): number | null {
  return value === NONE ? null : Number(value);
}

/**
 * 등록 정보를 목록 행으로 옮긴다.
 * 새로 세운 발전소는 아직 계측값도 설비도 없으므로 0 으로 두고 상태는 준비중이다 (SFR-003-10).
 */
function toSchoolRow(asset: PlantAsset): School {
  const regionName = regionNameOfCode(asset.regionCode);
  const region = REGIONS.find((item) => item.name === regionName) ?? REGIONS[0];

  return {
    id: asset.plantId,
    name: asset.plantName,
    regionCode: region.code,
    regionName: region.name,
    level: asset.level,
    address: asset.address,
    capacityKw: 0,
    inverterCount: 0,
    pyranometerStatus: 'disconnected',
    todayKwh: 0,
    monthKwh: 0,
    yearKwh: 0,
    utilization: 0,
    status: 'ready',
    installedAt: asset.installedAt,
    location: region.center,
  };
}

/**
 * 발전소 설비용량 — 딸린 설비들의 `instCapa` 합이다 (SFR-016-03).
 * 발전소 자체는 모듈 구성을 갖지 않으므로 손으로 넣는 값이 아니라 읽어 오는 값이다.
 */
export function usePlantCapacity() {
  const equipmentCreated = useEquipmentStore((state) => state.equipmentCreated);
  const equipmentPatched = useEquipmentStore((state) => state.equipmentPatched);
  const equipmentDeleted = useEquipmentStore((state) => state.equipmentDeleted);

  const sums = useMemo(() => {
    const totals = new Map<string, number>();

    mergeEquipment(equipmentCreated, equipmentPatched, equipmentDeleted).forEach((item) => {
      totals.set(item.plantId, (totals.get(item.plantId) ?? 0) + item.equipmentCapacity);
    });

    return totals;
  }, [equipmentCreated, equipmentPatched, equipmentDeleted]);

  return useCallback((plantId: string) => sums.get(plantId) ?? 0, [sums]);
}

/** 발전소 하나의 등록 정보를 꺼내는 길. 목록과 편집기가 같은 값을 본다. */
export function useAssetOf() {
  const assetPatched = useAssetStore((state) => state.assetPatched);
  const plantCreated = useAssetStore((state) => state.plantCreated);

  return useCallback(
    (plantId: string) => mergeAsset(plantId, assetPatched, plantCreated),
    [assetPatched, plantCreated],
  );
}

/** 발전소 목록. 새로 등록한 것을 앞에 세운다 — 방금 넣은 것이 목록 끝에 묻히면 확인이 어렵다. */
export function usePlantRows(): School[] {
  const plantCreated = useAssetStore((state) => state.plantCreated);
  const plantDeleted = useAssetStore((state) => state.plantDeleted);

  return useMemo(
    () => [...plantCreated.map(toSchoolRow), ...SCHOOLS].filter((school) => !plantDeleted.includes(school.id)),
    [plantCreated, plantDeleted],
  );
}

/** 수용가로 이을 계정. 서버는 발전소마다 userId 하나를 들고 있다. */
export function useCustomerAccounts() {
  const userCreated = useAssetStore((state) => state.userCreated);
  const userPatched = useAssetStore((state) => state.userPatched);
  const userDeleted = useAssetStore((state) => state.userDeleted);

  const users = useMemo(
    () => mergeUsers(userCreated, userPatched, userDeleted),
    [userCreated, userPatched, userDeleted],
  );

  return {
    options: [
      { value: NONE, label: '지정 안 함' },
      ...users.map((item) => ({ value: String(item.userId), label: `${item.name} · ${item.orgName}` })),
    ],
    nameOf: (userId: number | null) =>
      (userId === null ? null : users.find((item) => item.userId === userId)?.name) ?? '—',
  };
}
