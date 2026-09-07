import { useEffect } from 'react';
import { useSetThemeOverride, useTheme } from '@/stores/themeStore';

/**
 * 상황판에 들어오면 어두운 화면으로 (2026-09-04 회의 · 조치사항 #7).
 *
 * 종일 걸어 두고 멀리서 보는 화면이라 밝은 바탕은 그 자체가 광원이 된다. 그래서 이 화면만
 * **기본값**을 어둡게 잡는다. 못 박는 것이 아니라 기본값이다 — 머리띠의 고르개로 밝은 쪽을
 * 고를 수 있고, 그 선택은 이 화면에 있는 동안 살아 있다.
 *
 * 값은 저장소의 `override` 에 둔다. `html[data-theme]` 을 여기서 직접 갈아 끼우려 했더니
 * 걸리지 않았다 — 효과는 자식이 먼저 도는데, 조상인 `Provider` 가 뒤이어 저장소의 값으로
 * 덮어쓰기 때문이다. 같은 저장소를 거쳐야 두 곳이 다투지 않는다.
 */
export function useRoomTheme() {
  const theme = useTheme();
  const setOverride = useSetThemeOverride();

  useEffect(() => {
    setOverride('dark');

    // 나가면서 비운다 — 사용자가 서비스에 대해 골라 둔 값이 그대로 돌아온다
    return () => setOverride(null);
  }, [setOverride]);

  return {
    theme,
    toggle: () => setOverride(theme === 'dark' ? 'light' : 'dark'),
  };
}
