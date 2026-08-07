import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * 열린 패널을 바깥 클릭과 ESC 로 닫는다.
 *
 * 알림·도움말처럼 포털로 띄우는 패널은 여는 버튼이 패널 바깥에 있다. 그 버튼을 다시 눌러 닫을 때
 * `pointerdown` 에서 먼저 닫히고 이어지는 `click` 이 다시 열어 버리므로, 여는 쪽에는
 * `data-dismiss-ignore` 를 달아 두고 여기서 걸러 낸다.
 */
export function useDismissable(
  isOpen: boolean,
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;

      if (!target) return;
      if (ref.current?.contains(target)) return;
      // 패널을 여닫는 버튼은 스스로 토글하므로 여기서 손대지 않는다.
      if (target.closest('[data-dismiss-ignore]')) return;

      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, ref, onClose]);
}
