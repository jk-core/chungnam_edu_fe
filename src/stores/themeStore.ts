import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  /** 사용자가 서비스 전체에 대해 고른 값. 저장된다 */
  theme: Theme;
  /**
   * 지금 보고 있는 화면이 요구하는 값. **저장하지 않는다**.
   *
   * 통합관제 상황판처럼 화면 스스로 기본값을 갖는 자리가 있다 (2026-09-04 회의 · 조치사항 #7).
   * 그 값을 `theme` 에 써 버리면 localStorage 로 내려가, 상황판을 띄워 둔 채 창을 닫은 사용자가
   * 다음에 서비스를 열 때 고른 적 없는 어두운 화면을 만난다. 화면이 요구하는 값은 여기에 두고
   * 화면을 나가면서 비운다 — 사용자가 고른 값은 처음부터 끝까지 손대지 않는다.
   */
  override: Theme | null;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setOverride: (theme: Theme | null) => void;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      override: null,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      setOverride: (override) => set({ override }),
    }),
    {
      name: 'cne-theme',
      storage: createJSONStorage(() => localStorage),
      // 화면이 요구한 값은 저장에서 뺀다 — 이 화면을 떠나면 없던 일이어야 한다
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);

/** html[data-theme] 갱신 — 초기 부트스트랩과 `Provider` 의 효과가 쓴다. */
export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

/** 지금 화면에 걸려야 하는 값 — 화면이 요구한 것이 있으면 그쪽이 이긴다. */
export const getTheme = () => {
  const state = useThemeStore.getState();

  return state.override ?? state.theme;
};

export const useTheme = () => useThemeStore((state) => state.override ?? state.theme);

export const useToggleTheme = () => useThemeStore((state) => state.toggleTheme);

/** 두 갈래를 나란히 두고 고르는 자리에서 쓴다 — 어느 쪽인지 알고 누르므로 뒤집는 것이 아니다. */
export const useSetTheme = () => useThemeStore((state) => state.setTheme);

/** 화면 스스로 기본값을 갖는 자리에서 쓴다. 나가면서 `null` 로 비운다. */
export const useSetThemeOverride = () => useThemeStore((state) => state.setOverride);

export default useThemeStore;
