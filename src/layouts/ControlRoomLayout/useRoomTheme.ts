import { useEffect } from 'react';
import { useSetThemeOverride } from '@/stores/themeStore';
import type { Theme } from '@/stores/themeStore';

/**
 * 상황판의 밝기.
 *
 * 시안마다 못 박는다 (2026-09-16 지시) — A 는 라이트, B 는 다크, C 는 라이트다. 고르개를
 * 두지 않는 까닭은 견줌 때문이다: 누가 한 번 눌러 바꾸면 그 값이 남아, 다음에 나란히 놓고
 * 볼 때 시안이 제 밝기로 서지 않는다.
 *
 * 서비스 전체의 `theme` 이 아니라 `override` 에 건다. 하나로 합치면 벽에 걸어 두는 화면을
 * 어둡게 쓰는 것만으로 앉아서 보는 화면까지 어두워진다. 나가면서 비우므로 사용자가 서비스에
 * 대해 골라 둔 값이 그대로 돌아온다.
 *
 * `html[data-theme]` 을 여기서 직접 갈아 끼우지 않는다. 효과는 자식이 먼저 도는데 조상인
 * `Provider` 가 뒤이어 저장소의 값으로 덮어써, 건 것이 곧바로 지워진다.
 */
export function useRoomTheme(theme: Theme) {
  const setOverride = useSetThemeOverride();

  useEffect(() => {
    setOverride(theme);

    return () => setOverride(null);
  }, [theme, setOverride]);
}
