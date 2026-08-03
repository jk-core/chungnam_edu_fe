export type BoardKind = 'notice' | 'qna';

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
  attachments: string[];
  comments: BoardComment[];
  /** 공지를 메인 화면 팝업으로 띄울 기간 (SFR-025-02/03) */
  popup: { start: string; end: string } | null;
}
