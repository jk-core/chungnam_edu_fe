import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getAccountById, isAdminRole } from '@/mocks/accounts';
import useAssetStore from '@/stores/assetStore';
import type { AuthUser, Role } from '@/interface/account';

interface AuthState {
  user: AuthUser | null;
  /** 세션 만료 시각(epoch ms). SFR-026 역할별 유지시간을 반영한다. */
  expiresAt: number | null;
  /** 아이디로 데모 계정을 찾아 로그인한다. 없으면 false. */
  login: (accountId: string) => boolean;
  logout: () => void;
  /** 사용자가 화면을 만지면 세션을 늘린다. */
  touchSession: () => void;
}

const minutesToMs = (minutes: number) => minutes * 60 * 1000;

/** 역할별 유지시간 — 관리자 콘솔에서 저장한 정책을 그대로 읽는다 (SFR-026). */
function sessionMinutesOf(role: Role): number {
  const { policy } = useAssetStore.getState();

  return isAdminRole(role) ? policy.adminSessionMinutes : policy.userSessionMinutes;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      expiresAt: null,
      login: (accountId) => {
        const account = getAccountById(accountId);

        if (!account) return false;

        set({ user: account, expiresAt: Date.now() + minutesToMs(sessionMinutesOf(account.role)) });

        return true;
      },
      logout: () => set({ user: null, expiresAt: null }),
      touchSession: () => {
        const { user, expiresAt } = get();

        if (!user || expiresAt === null) return;

        const span = minutesToMs(sessionMinutesOf(user.role));

        // 남은 시간이 절반 이상이면 그대로 둔다. 클릭마다 저장하면 낭비다.
        if (expiresAt - Date.now() > span / 2) return;

        set({ expiresAt: Date.now() + span });
      },
    }),
    {
      name: 'cne-auth',
      storage: createJSONStorage(() => localStorage),
      // 계정 정보는 목업에서 다시 찾아오므로 세션만 남긴다.
      partialize: (state) => ({ user: state.user, expiresAt: state.expiresAt }),
      /*
        1 판 세션에는 없어진 등급(게스트·수용가)이 들어 있다. 그대로 살려 두면 사라진 등급으로
        권한을 판정하게 되므로 판이 다르면 로그인부터 다시 받는다.
      */
      version: 2,
      migrate: () => ({ user: null, expiresAt: null }),
    },
  ),
);

/**
 * 만료된 세션을 지운다.
 * 앱 부트스트랩에서 한 번 호출한다 — themeStore 의 applyTheme 과 같은 자리다.
 */
export function pruneExpiredSession() {
  const { expiresAt, logout } = useAuthStore.getState();

  if (expiresAt !== null && expiresAt <= Date.now()) logout();
}

export const getAuthUser = () => useAuthStore.getState().user;

export const useAuthUser = () => useAuthStore((state) => state.user);

export const useLogin = () => useAuthStore((state) => state.login);

export const useLogout = () => useAuthStore((state) => state.logout);

/** 권한이 전체 조회인지 (SFR-023-02) */
export function useCanSeeAllPlants(): boolean {
  return useAuthStore((state) => state.user === null || state.user.plantIds.length === 0);
}

/** 관리자 콘솔 진입 가능 여부 (SFR-018-05, SER-001-18) */
export function useIsAdmin(): boolean {
  return useAuthStore((state) => isAdminRole(state.user?.role));
}

export function hasRole(user: AuthUser | null, roles: Role[] | undefined): boolean {
  if (!roles) return true;

  return user !== null && roles.includes(user.role);
}

export default useAuthStore;
