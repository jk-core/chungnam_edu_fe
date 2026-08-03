import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => get().setTheme(get().theme === 'light' ? 'dark' : 'light'),
    }),
    {
      name: 'cne-theme',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** html[data-theme] 갱신 — 스토어 변경과 초기 부트스트랩 양쪽에서 쓴다. */
export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export const getTheme = () => useThemeStore.getState().theme;

export const useTheme = () => useThemeStore((state) => state.theme);

export const useToggleTheme = () => useThemeStore((state) => state.toggleTheme);

export default useThemeStore;
