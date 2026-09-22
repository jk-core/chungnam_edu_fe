import { useMemo } from 'react';
import { isReviewRole } from '@/configs/roles';
import { mergePosts } from '@/stores/boardStore';
import useBoardStore from '@/stores/boardStore';
import type { BoardKind, BoardPost } from '@/interface/board';
import type { Role } from '@/interface/account';

/** 게시판 이름 — 화면 글귀와 확인 문구가 같은 말을 쓰게 한다 */
export const KIND_LABEL: Record<BoardKind, string> = { notice: '공지사항', inquiry: '문의하기' };

/** 공지사항은 교육청이 알리는 자리라 아무나 쓰지 못한다 (SFR-025-01) */
export const WRITE_RESTRICTED: Record<BoardKind, boolean> = { notice: true, inquiry: false };

/**
 * 이 글을 고치거나 지울 수 있는가 (SFR-025-01/04).
 *
 * 교육청은 게시판을 관리하는 자리라 남의 글도 손댄다. 「제가 쓴 글인가」는 지금 가릴 수 없다 —
 * 글은 작성자를 소속 기관 이름(`author`)으로만 들고 있는데 v2.0 의 `/user/userInfo` 가
 * 소속을 주지 않아 맞댈 것이 없다. 아무 글이나 손대게 두는 쪽이 더 나쁘므로 닫아 둔다.
 * 게시판 API 가 작성자 식별자를 주면 그 값으로 되살린다.
 */
export function canManagePost(user: { role: Role } | null): boolean {
  if (!user) return false;

  return isReviewRole(user.role);
}

export interface BoardNeighbors {
  /** 목록에서 한 칸 위 — 없으면 맨 앞 글이다 */
  previous: BoardPost | null;
  /** 목록에서 한 칸 아래 */
  next: BoardPost | null;
  /** 목록에서 몇 번째인지 (1부터). 찾지 못하면 0 */
  order: number;
}

/**
 * 한 게시판의 글 목록 (SFR-025).
 *
 * 게시판마다 따로 선 화면이 저마다 걸러 내면, 고정 글이 위로 오는 규칙이나 이웃 글을 세는
 * 방법이 조금씩 어긋난다. 목록을 만드는 셈은 여기 하나만 둔다.
 */
export function useBoardPosts(kind: BoardKind) {
  const created = useBoardStore((state) => state.created);
  const patched = useBoardStore((state) => state.patched);
  const deleted = useBoardStore((state) => state.deleted);

  const posts = useMemo(
    () => mergePosts(created, patched, deleted).filter((post) => post.kind === kind),
    [kind, created, patched, deleted],
  );

  /**
   * 목록에서 이 글의 앞뒤.
   * 목록에 보이는 차례 그대로다 — 고정 글이 위로 온 순서를 상세에서도 이어 간다.
   */
  const neighborsOf = (id: string): BoardNeighbors => {
    const index = posts.findIndex((post) => post.id === id);

    if (index < 0) return { previous: null, next: null, order: 0 };

    return {
      previous: posts[index - 1] ?? null,
      next: posts[index + 1] ?? null,
      order: index + 1,
    };
  };

  return { posts, neighborsOf, find: (id: string) => posts.find((post) => post.id === id) ?? null };
}
