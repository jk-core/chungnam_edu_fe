import { useCallback, useEffect, useState } from 'react';

interface Fullscreen {
  isFullscreen: boolean;
  toggle: () => void;
}

/**
 * 전체화면 토글 (SFR-004, SFR-005-08).
 *
 * 벽면·복도 모니터에 걸어 두는 화면들이 함께 쓴다. 브라우저 UI 를 걷어 내면 같은 모니터에
 * 담기는 내용이 늘어난다.
 *
 * 상태를 따로 두지 않고 `fullscreenchange` 를 듣는 이유는, ESC 나 브라우저 버튼으로 빠져나갔을 때도
 * 버튼 문구가 맞아야 하기 때문이다.
 */
export function useFullscreen(): Fullscreen {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement !== null);

    document.addEventListener('fullscreenchange', sync);

    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();

      return;
    }

    void document.documentElement.requestFullscreen().catch(() => {
      // 브라우저가 막으면 그냥 창 모드로 둔다.
    });
  }, []);

  return { isFullscreen, toggle };
}
