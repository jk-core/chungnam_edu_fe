import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AssetChange, PlantAsset } from '@/interface/asset';
import type { LoginPolicy, ManagedUser } from '@/interface/account';
import { getSeedAsset, SEED_ASSET_CHANGES } from '@/mocks/assetMaster';
import { LOGIN_POLICY, SEED_USERS } from '@/mocks/accounts';

/**
 * 관리자 콘솔의 쓰기 상태.
 * 시드는 mocks 가 갖고, 여기는 변경분만 얹는다 — API 로 갈 때 셀렉터 안쪽만 바꾼다.
 */
interface AssetState {
  /** 발전소 등록 정보 변경분 (SFR-016) */
  assetPatched: Record<string, Partial<PlantAsset>>;
  /** 수정 이력 — 저장할 때마다 앞에 쌓인다 (SFR-016-06) */
  changes: AssetChange[];
  saveAsset: (plantId: string, change: Partial<PlantAsset>, entries: AssetChange[]) => void;

  /** 사용자 관리 변경분 (SFR-018) */
  userCreated: ManagedUser[];
  userPatched: Record<string, Partial<ManagedUser>>;
  userDeleted: string[];
  saveUser: (user: ManagedUser) => void;
  patchUser: (id: string, change: Partial<ManagedUser>) => void;
  removeUser: (id: string) => void;
  nextUserId: () => string;

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
      saveUser: (user) =>
        set((state) => {
          if (state.userCreated.some((item) => item.id === user.id)) {
            return { userCreated: state.userCreated.map((item) => (item.id === user.id ? user : item)) };
          }

          if (SEED_USERS.some((item) => item.id === user.id)) {
            return { userPatched: { ...state.userPatched, [user.id]: user } };
          }

          return { userCreated: [user, ...state.userCreated] };
        }),
      patchUser: (id, change) =>
        set((state) => {
          if (state.userCreated.some((item) => item.id === id)) {
            return { userCreated: state.userCreated.map((item) => (item.id === id ? { ...item, ...change } : item)) };
          }

          return { userPatched: { ...state.userPatched, [id]: { ...state.userPatched[id], ...change } } };
        }),
      removeUser: (id) => set((state) => ({ userDeleted: [...state.userDeleted, id] })),
      nextUserId: () => `usr-${String(9100 + get().userCreated.length)}`,

      policy: LOGIN_POLICY,
      savePolicy: (policy) => set({ policy }),

      resentIds: [],
      markResent: (id) => set((state) => ({ resentIds: [...new Set([...state.resentIds, id])] })),
    }),
    {
      name: 'cne-admin',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** 시드 + 변경분이 합쳐진 발전소 등록 정보 */
export function mergeAsset(plantId: string, patched: Record<string, Partial<PlantAsset>>): PlantAsset | null {
  const seed = getSeedAsset(plantId);

  return seed ? { ...seed, ...patched[plantId] } : null;
}

/** 시드 + 사용자 저장분이 합쳐진 수정 이력 */
export function mergeChanges(changes: AssetChange[]): AssetChange[] {
  return [...changes, ...SEED_ASSET_CHANGES];
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
