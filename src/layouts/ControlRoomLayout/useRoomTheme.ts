import { useEffect } from 'react';
import { useRoomChoice, useSetRoomTheme, useSetThemeOverride, useTheme } from '@/stores/themeStore';

/** 고른 적이 없을 때의 값 — 종일 걸어 두는 화면이라 밝은 바탕은 그 자체가 광원이 된다 */
const ROOM_DEFAULT = 'dark';

/**
 * 상황판의 밝기 (2026-09-04 회의 · 조치사항 #7).
 *
 * 어두운 쪽이 **기본값**이지 못 박은 것이 아니다 — 회의가 정한 것은 「다크를 기본으로, 라이트도
 * 고를 수 있게」 였다. 머리띠의 고르개로 밝은 쪽을 고를 수 있고, 고른 값은 다음에 들어와도
 * 그대로 남는다 (2026-09-07 지시).
 *
 * 값이 두 겹인 까닭.
 *
 * `room` 은 이 화면에서 고른 값이라 저장되고, `override` 는 지금 화면에 걸린 값이라 나가면서
 * 비운다. 하나로 합쳐 서비스 전체의 `theme` 에 쓰면, 상황판을 어둡게 쓰는 것만으로 앉아서 보는
 * 화면까지 어두워진다.
 *
 * `html[data-theme]` 을 여기서 직접 갈아 끼우지 않는다. 효과는 자식이 먼저 도는데 조상인
 * `Provider` 가 뒤이어 저장소의 값으로 덮어써, 건 것이 곧바로 지워진다.
 */
export function useRoomTheme() {
  const theme = useTheme();
  const choice = useRoomChoice();
  const setOverride = useSetThemeOverride();
  const setRoom = useSetRoomTheme();

  useEffect(() => {
    setOverride(choice ?? ROOM_DEFAULT);

    // 나가면서 비운다 — 사용자가 서비스에 대해 골라 둔 값이 그대로 돌아온다
    return () => setOverride(null);
  }, [choice, setOverride]);

  return {
    theme,
    toggle: () => setRoom(theme === 'dark' ? 'light' : 'dark'),
  };
}
