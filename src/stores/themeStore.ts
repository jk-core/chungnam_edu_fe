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
  /**
   * 통합관제 상황판에서 사람이 고른 값. **저장된다**.
   *
   * `override` 만 있을 때는 고르고 새로고침하면 도로 어두워졌다 — 화면이 들어올 때마다 기본값을
   * 다시 걸기 때문이다. 회의가 정한 것은 「다크를 기본으로, 라이트도 고를 수 있게」 이므로
   * (2026-09-04), 고른 값은 남아 있어야 한다. 비어 있으면 기본값인 다크를 쓴다.
   *
   * 서비스 전체의 `theme` 과 따로 두는 까닭은 이 선택이 상황판 안에서만 뜻을 갖기 때문이다 —
   * 벽에 걸어 두는 화면을 어둡게 쓴다고 해서 앉아서 보는 화면까지 어두워질 이유가 없다.
   */
  room: Theme | null;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setOverride: (theme: Theme | null) => void;
  setRoom: (theme: Theme) => void;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      override: null,
      room: null,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      setOverride: (override) => set({ override }),
      setRoom: (room) => set({ room, override: room }),
    }),
    {
      name: 'cne-theme',
      storage: createJSONStorage(() => localStorage),
      /*
        지금 걸려 있는 값(`override`)은 저장에서 뺀다 — 화면을 떠나면 없던 일이어야 한다.
        상황판에서 **고른** 값(`room`)은 남긴다. 고른 것이 남지 않으면 고를 수 있는 것이 아니다.
      */
      partialize: (state) => ({ theme: state.theme, room: state.room }),
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

/** 상황판에서 고른 값 — 읽는 쪽은 비어 있으면 그 화면의 기본값을 쓴다 */
export const useRoomChoice = () => useThemeStore((state) => state.room);

export const useSetRoomTheme = () => useThemeStore((state) => state.setRoom);

export default useThemeStore;
