import { useMemo } from 'react';
import { SEED_ASSETS } from '@/mocks/assetMaster';
import useAssetStore, { mergeUsers } from '@/stores/assetStore';
import type { ManagedUser } from '@/interface/account';
import type { PlantAsset } from '@/interface/asset';

/**
 * 발전소 등록 정보와 담당자 계정.
 *
 * 관리자 콘솔의 설비 폼이 검색기에 쓰려고 만든 것인데, 발전소 정보 화면도 같은 값을 읽는다.
 * 관리자 폴더 아래 두면 조회 화면이 관리자 화면을 가로질러 가져다 쓰게 되어 위치의 뜻이
 * 깨지므로 여기로 올렸다. 두 훅이 함께 있는 것은 지운 것을 거르는 규칙을 같이 봐야 하기
 * 때문이다 — 한쪽만 지운 계정을 세우면 폼과 목록이 다른 것을 보게 된다.
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
