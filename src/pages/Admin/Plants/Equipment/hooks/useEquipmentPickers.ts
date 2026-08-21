import { useMemo } from 'react';
import { SEED_ASSETS } from '@/mocks/assetMaster';
import useAssetStore, { mergeUsers } from '@/stores/assetStore';
import type { ManagedUser } from '@/interface/account';
import type { PlantAsset } from '@/interface/asset';

/**
 * 설비 폼의 검색기가 고를 목록.
 *
 * 사용자와 발전소는 발전소 관리·사용자 관리가 쥔 값이라 설비 쪽 스토어에 없다. 두 검색기가
 * 같은 규칙(지운 것 제외)을 봐야 해서 여기 한 곳에서 꺼낸다.
 */
export function useManagedUsers(): ManagedUser[] {
  const userCreated = useAssetStore((state) => state.userCreated);
  const userPatched = useAssetStore((state) => state.userPatched);
  const userDeleted = useAssetStore((state) => state.userDeleted);

  // 개발자 등급은 화면 어디에도 세우지 않는다 — 서버도 목록에서 빼고 내려준다.
  return useMemo(
    () => mergeUsers(userCreated, userPatched, userDeleted).filter((user) => user.role !== 'developer'),
    [userCreated, userPatched, userDeleted],
  );
}

export function usePlantAssets(): PlantAsset[] {
  const plantCreated = useAssetStore((state) => state.plantCreated);
  const plantDeleted = useAssetStore((state) => state.plantDeleted);
  const assetPatched = useAssetStore((state) => state.assetPatched);

  return useMemo(
    () => [...plantCreated, ...SEED_ASSETS]
      .filter((asset) => !plantDeleted.includes(asset.plantId))
      .map((asset) => ({ ...asset, ...assetPatched[asset.plantId] })),
    [plantCreated, plantDeleted, assetPatched],
  );
}
