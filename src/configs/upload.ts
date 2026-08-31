/**
 * 파일 첨부로 받는 갈래.
 *
 * 값을 여기 모아 두는 것은 서버가 받아 주는 것과 화면이 고르게 하는 것이 갈리지 않게 하려는
 * 것이다 — 고를 수 있는데 올리면 튕기는 조합이 생기면 사용자는 무엇이 잘못됐는지 알 수 없다.
 */

/** 현장보고서 사진 (SFR-021-04~06) */
export const PHOTO_ACCEPT = ['.jpg', '.jpeg', '.png', '.webp'].join(',');

/** 게시판 첨부 (SFR-025-06) — 이미지와 문서를 함께 받는다 */
export const ATTACH_ACCEPT = [
  ...PHOTO_ACCEPT.split(','),
  '.pdf',
  '.hwp',
  '.hwpx',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.csv',
  '.ppt',
  '.pptx',
  '.zip',
].join(',');
