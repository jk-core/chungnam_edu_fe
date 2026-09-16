import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { isAdminRole, isScopedRole } from '@/mocks/accounts';
import type { AuthUser, Role } from '@/interface/account';

/** 로그인이 돌려준 토큰 한 벌 (`SignInResForm`) */
export interface Session {
  userId: number;
  accessToken: string;
  refreshToken: string;
  refreshTokenId: string;
}

interface AuthState {
  session: Session | null;
  /**
   * `/user/userInfo` 가 준 계정. 세션과 따로 두는 것은 새로고침 때문이다 —
   * 조회가 돌아오기 전에도 가드가 판정할 수 있어야 로그인 화면으로 튕기지 않는다.
   */
  user: AuthUser | null;
  setSession: (session: Session) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: AuthUser) => void;
  clear: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      setSession: (session) => set({ session }),
      setAccessToken: (accessToken) => {
        const { session } = get();

        if (!session) return;

        set({ session: { ...session, accessToken } });
      },
      setUser: (user) => set({ user }),
      clear: () => set({ session: null, user: null }),
    }),
    {
      name: 'cne-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session, user: state.user }),
      /*
        2 판까지는 목 계정을 통째로 담아 두었다. 그 모양에는 토큰이 없어 살려 둘 수 없으므로
        판이 다르면 로그인부터 다시 받는다.
      */
      version: 3,
      migrate: () => ({ session: null, user: null }),
    },
  ),
);

/* 인터셉터가 렌더 밖에서 부르는 자리 — 훅을 쓸 수 없어 getState 로 연다. */
export const getSession = () => useAuthStore.getState().session;

export const setAccessToken = (accessToken: string) => useAuthStore.getState().setAccessToken(accessToken);

export const clearSession = () => useAuthStore.getState().clear();

export const getAuthUser = () => useAuthStore.getState().user;

export const useAuthUser = () => useAuthStore((state) => state.user);

export const useSetSession = () => useAuthStore((state) => state.setSession);

export const useSetAuthUser = () => useAuthStore((state) => state.setUser);

export const useClearSession = () => useAuthStore((state) => state.clear);

/**
 * 권한이 전체 조회인지 (SFR-023-02).
 *
 * 등급으로 가른다 — `/user/userInfo` 가 담당 발전소(`powerPlantIds`)를 아직 주지 않아서다.
 * 「비어 있으면 제한 없음」으로 두면 기관담당자까지 도 전체를 보게 되어 권한이 넓어진다.
 * 로그인하지 않은 채 열리는 화면(교육용 대시보드)은 제한 없이 본다.
 */
export function useCanSeeAllPlants(): boolean {
  return useAuthStore((state) => state.user === null || !isScopedRole(state.user.role));
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
