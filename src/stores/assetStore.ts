import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useMemo } from 'react';
import type { ChangeLog } from '@/interface/changeLog';
import type { LoginPolicy, ManagedUser } from '@/interface/account';
import type { PlantAsset } from '@/interface/asset';
import { getSeedAsset, SEED_ASSET_CHANGES } from '@/mocks/assetMaster';
import { LOGIN_POLICY, SEED_USER_CHANGES, SEED_USERS } from '@/mocks/accounts';

/**
 * 관리자 콘솔의 쓰기 상태.
 * 시드는 mocks 가 갖고, 여기는 변경분만 얹는다 — API 로 갈 때 셀렉터 안쪽만 바꾼다.
 */
interface AssetState {
  /** 새로 등록한 발전소 (SFR-016-01) */
  plantCreated: PlantAsset[];
  createPlant: (asset: PlantAsset, entry: ChangeLog) => void;
  nextPlantId: () => string;

  /** 삭제한 발전소 id (SFR-016-05) — 딸린 설비도 함께 감춘다 */
  plantDeleted: string[];
  removePlant: (plantId: string, entry: ChangeLog) => void;

  /** 발전소 등록 정보 변경분 (SFR-016) */
  assetPatched: Record<string, Partial<PlantAsset>>;
  /** 수정 이력 — 저장할 때마다 앞에 쌓인다 (SFR-016-06) */
  changes: ChangeLog[];
  saveAsset: (plantId: string, change: Partial<PlantAsset>, entries: ChangeLog[]) => void;

  /** 사용자 관리 변경분 (SFR-018) */
  userCreated: ManagedUser[];
  userPatched: Record<string, Partial<ManagedUser>>;
  userDeleted: string[];
  /** 담당자 변경 이력 — 저장할 때마다 앞에 쌓인다 (SFR-018-04) */
  userChanges: ChangeLog[];
  saveUser: (user: ManagedUser, entries: ChangeLog[]) => void;
  patchUser: (id: string, change: Partial<ManagedUser>, entries: ChangeLog[]) => void;
  removeUser: (id: string, entry: ChangeLog) => void;
  nextUserId: () => string;
  /** 서버가 새로 매길 사용자 번호를 흉내 낸다 (userId) */
  nextUserSeq: () => number;

  /** 로그인 설정 덮어쓰기 (SFR-026) */
  policy: LoginPolicy;
  savePolicy: (policy: LoginPolicy) => void;

  /** 재송신으로 회복시킨 연계 이력 id (SFR-027-05) */
  resentIds: string[];
  markResent: (id: string) => void;
}

const useAssetStore = create<AssetState>()(
  persist(
    (set, get) => ({
      plantCreated: [],
      createPlant: (asset, entry) =>
        set((state) => ({
          plantCreated: [asset, ...state.plantCreated],
          changes: [entry, ...state.changes],
        })),
      // 시드는 학교 id 를 쓰므로 새 발전소는 겹치지 않는 앞자리를 둔다.
      nextPlantId: () => `NEW-${String(get().plantCreated.length + 1).padStart(3, '0')}`,

      plantDeleted: [],
      // 발전소를 지워도 누가 언제 지웠는지는 이력에 남긴다.
      removePlant: (plantId, entry) =>
        set((state) => ({
          plantDeleted: [...new Set([...state.plantDeleted, plantId])],
          plantCreated: state.plantCreated.filter((item) => item.plantId !== plantId),
          changes: [entry, ...state.changes],
        })),

      assetPatched: {},
      changes: [],
      saveAsset: (plantId, change, entries) =>
        set((state) => ({
          assetPatched: { ...state.assetPatched, [plantId]: { ...state.assetPatched[plantId], ...change } },
          changes: [...entries, ...state.changes],
        })),

      userCreated: [],
      userPatched: {},
      userDeleted: [],
      userChanges: [],
      saveUser: (user, entries) =>
        set((state) => {
          const logged = [...entries, ...state.userChanges];

          if (state.userCreated.some((item) => item.id === user.id)) {
            return {
              userCreated: state.userCreated.map((item) => (item.id === user.id ? user : item)),
              userChanges: logged,
            };
          }

          if (SEED_USERS.some((item) => item.id === user.id)) {
            return { userPatched: { ...state.userPatched, [user.id]: user }, userChanges: logged };
          }

          return { userCreated: [user, ...state.userCreated], userChanges: logged };
        }),
      patchUser: (id, change, entries) =>
        set((state) => {
          const logged = [...entries, ...state.userChanges];

          if (state.userCreated.some((item) => item.id === id)) {
            return {
              userCreated: state.userCreated.map((item) => (item.id === id ? { ...item, ...change } : item)),
              userChanges: logged,
            };
          }

          return {
            userPatched: { ...state.userPatched, [id]: { ...state.userPatched[id], ...change } },
            userChanges: logged,
          };
        }),
      // 계정은 지워도 누가 언제 지웠는지는 남겨 둔다.
      removeUser: (id, entry) =>
        set((state) => ({ userDeleted: [...state.userDeleted, id], userChanges: [entry, ...state.userChanges] })),
      nextUserId: () => `usr-${String(9100 + get().userCreated.length)}`,
      // 시드가 쓰는 1~수십 번대를 피해 9000 위에서 센다.
      nextUserSeq: () => 9000 + get().userCreated.length + 1,

      policy: LOGIN_POLICY,
      savePolicy: (policy) => set({ policy }),

      resentIds: [],
      markResent: (id) => set((state) => ({ resentIds: [...new Set([...state.resentIds, id])] })),
    }),
    {
      name: 'cne-admin',
      storage: createJSONStorage(() => localStorage),
      /*
        1 판의 발전소에는 설치 시기가 있고 담당 업체가 없다. 사용자 등급도 그때는 다른 이름이었다.
        옛 값을 그대로 읽으면 `managerEnterprise` 가 비어 등록 정보 화면이 그 자리에서 죽는다.
        3 판에서 이력이 plantName·userName 대신 targetName 을 갖는다 — 옛 줄은 대상명 칸이 빈다.
      */
      version: 3,
      migrate: (persisted) => ({
        ...(persisted as AssetState),
        plantCreated: [],
        assetPatched: {},
        userCreated: [],
        userPatched: {},
        changes: [],
        userChanges: [],
      }),
    },
  ),
);

/**
 * 시드 + 변경분이 합쳐진 발전소 등록 정보.
 * 새로 등록한 발전소는 시드에 없으므로 생성 목록에서 먼저 찾는다.
 */
export function mergeAsset(
  plantId: string,
  patched: Record<string, Partial<PlantAsset>>,
  created: PlantAsset[] = [],
): PlantAsset | null {
  const seed = created.find((item) => item.plantId === plantId) ?? getSeedAsset(plantId);

  return seed ? { ...seed, ...patched[plantId] } : null;
}

/**
 * 삭제한 발전소 id 목록 (SFR-016-05).
 * 장비 6종 화면이 저마다 이 목록으로 자기 줄을 걸러 낸다 — 발전소가 사라지면 딸린 설비도 감춘다.
 */
export function useDeletedPlants(): string[] {
  return useAssetStore((state) => state.plantDeleted);
}

/** 시드 + 사용자 저장분이 합쳐진 발전소 수정 이력 (SFR-016-06) */
export function usePlantChanges(): ChangeLog[] {
  const changes = useAssetStore((state) => state.changes);

  return useMemo(() => [...changes, ...SEED_ASSET_CHANGES], [changes]);
}

/** 시드 + 사용자 저장분이 합쳐진 담당자 변경 이력 (SFR-018-04) */
export function useUserChanges(): ChangeLog[] {
  const userChanges = useAssetStore((state) => state.userChanges);

  return useMemo(() => [...userChanges, ...SEED_USER_CHANGES], [userChanges]);
}

/** 시드 + 변경분이 합쳐진 사용자 목록 */
export function mergeUsers(
  created: ManagedUser[],
  patched: Record<string, Partial<ManagedUser>>,
  deleted: string[],
): ManagedUser[] {
  return [...created, ...SEED_USERS]
    .filter((user) => !deleted.includes(user.id))
    .map((user) => ({ ...user, ...patched[user.id] }));
}

export default useAssetStore;
