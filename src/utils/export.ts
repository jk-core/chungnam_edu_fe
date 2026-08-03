/** CSV 한 열의 정의. Table 의 Column 은 ReactNode 를 반환해 그대로 쓸 수 없어 따로 둔다. */
export interface CsvColumn<T> {
  header: string;
  value: (row: T, index: number) => string | number;
}

/** 쉼표·따옴표·줄바꿈이 든 값은 따옴표로 감싸고 안쪽 따옴표를 두 번 쓴다. */
function escapeCell(value: string | number): string {
  const text = String(value ?? '');

  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * 표를 CSV 로 내려받는다 (SFR-010-05).
 * 맨 앞에 BOM 을 붙여야 엑셀이 UTF-8 로 읽어 한글이 깨지지 않는다.
 */
export function exportCsv<T>(filename: string, columns: CsvColumn<T>[], rows: T[]): void {
  const BOM = '﻿';
  const head = columns.map((column) => escapeCell(column.header)).join(',');
  const body = rows
    .map((row, index) => columns.map((column) => escapeCell(column.value(row, index))).join(','))
    .join('\r\n');

  triggerDownload(`${filename}.csv`, new Blob([`${BOM}${head}\r\n${body}`], { type: 'text/csv;charset=utf-8;' }));
}
