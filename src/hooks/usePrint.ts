import { useCallback } from 'react';

/**
 * 브라우저 인쇄로 PDF 를 만든다 (SFR-019-05, SFR-020-05, SFR-021-17).
 * document.title 이 곧 저장 파일 이름이 되므로 인쇄 직전에 바꿔 두고 끝나면 되돌린다.
 */
export function usePrint() {
  return useCallback((filename?: string) => {
    if (!filename) {
      window.print();

      return;
    }

    const previous = document.title;
    const restore = () => {
      document.title = previous;
      window.removeEventListener('afterprint', restore);
    };

    document.title = filename;
    window.addEventListener('afterprint', restore);
    window.print();
  }, []);
}
