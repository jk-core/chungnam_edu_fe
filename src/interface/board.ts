export type BoardKind = 'notice' | 'inquiry';

/**
 * 글에 붙은 파일.
 *
 * 이름만 갖고 있으면 내려받는 수밖에 없다. 사진은 글을 읽는 자리에서 바로 보여야
 * "무슨 사진인지 열어 봐야 아는" 일이 없다 (SFR-025-06).
 */
export interface BoardAttachment {
  name: string;
  /** 이미지면 본문에 펼치고, 문서면 목록에 이름만 남긴다 */
  kind: 'image' | 'file';
  /** 이미지가 놓인 자리. 문서는 비어 있다 */
  url: string | null;
}

export interface BoardComment {
  id: string;
  author: string;
  body: string;
  at: string;
}

export interface BoardPost {
  id: string;
  kind: BoardKind;
  title: string;
  body: string;
  author: string;
  at: string;
  /** 목록 맨 위에 고정 */
  pinned: boolean;
  views: number;
  attachments: BoardAttachment[];
  comments: BoardComment[];
  /** 공지를 메인 화면 팝업으로 띄울 기간 (SFR-025-02/03) */
  popup: { start: string; end: string } | null;
}
