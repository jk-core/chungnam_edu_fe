import { useCallback, useState } from 'react';
import type { RefObject } from 'react';

/** A4 크기(mm) — jsPDF 가 mm 단위로 자리를 잡는다. */
const A4 = { width: 210, height: 297 };

/**
 * 보고서를 PDF 로 내려받는다 (SFR-019-05, SFR-020-05).
 *
 * 장마다 따로 캡처해 한 장씩 담는다 — 긴 이미지를 잘라 넣으면 잘린 자리가 글자 한가운데를
 * 지나가 페이지가 어긋난다. 지면이 이미 A4 비율로 고정돼 있어 그대로 한 장에 맞는다.
 *
 * 라이브러리는 쓸 때 불러온다. 보고서를 안 여는 사람에게까지 번들을 무겁게 할 이유가 없다.
 */
export function useReportPdf() {
  const [busy, setBusy] = useState(false);

  const download = useCallback(async (sheetRef: RefObject<HTMLElement | null>, filename: string) => {
    const sheet = sheetRef.current;

    if (!sheet || busy) return;

    const pages = [...sheet.querySelectorAll<HTMLElement>('.report-page')];

    if (pages.length === 0) return;

    setBusy(true);

    /*
      미리보기는 화면 폭에 맞춰 줄여 두었다. 줄인 채로 캡처하면 그 크기 그대로 담겨 흐려지므로,
      담는 동안만 원래 크기로 되돌린다.
    */
    const previousTransform = sheet.style.transform;

    sheet.style.transform = 'none';

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let index = 0; index < pages.length; index += 1) {
        // 장을 순서대로 담아야 해서 한 장씩 기다린다.
        const canvas = await html2canvas(pages[index], {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true,
        });

        if (index > 0) pdf.addPage();

        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, A4.width, A4.height);
      }

      pdf.save(`${filename}.pdf`);
    } finally {
      sheet.style.transform = previousTransform;
      setBusy(false);
    }
  }, [busy]);

  return { download, busy };
}
