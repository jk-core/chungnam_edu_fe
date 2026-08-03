import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { BoardComment, BoardPost } from '@/interface/board';
import { SEED_POSTS } from '@/mocks/board';
import { TODAY } from '@/mocks/today';

interface BoardState {
  created: BoardPost[];
  patched: Record<string, Partial<BoardPost>>;
  deleted: string[];
  /** 팝업을 닫아 둔 공지 id — 다시 띄우지 않는다 (SFR-025-02) */
  dismissedPopups: string[];
  write: (post: BoardPost) => void;
  patch: (id: string, change: Partial<BoardPost>) => void;
  remove: (id: string) => void;
  comment: (postId: string, item: BoardComment) => void;
  dismissPopup: (id: string) => void;
  nextId: () => string;
}

const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      created: [],
      patched: {},
      deleted: [],
      dismissedPopups: [],
      write: (post) =>
        set((state) => {
          if (state.created.some((item) => item.id === post.id)) {
            return { created: state.created.map((item) => (item.id === post.id ? post : item)) };
          }

          if (SEED_POSTS.some((item) => item.id === post.id)) {
            return { patched: { ...state.patched, [post.id]: post } };
          }

          return { created: [post, ...state.created] };
        }),
      patch: (id, change) =>
        set((state) => {
          if (state.created.some((item) => item.id === id)) {
            return { created: state.created.map((item) => (item.id === id ? { ...item, ...change } : item)) };
          }

          return { patched: { ...state.patched, [id]: { ...state.patched[id], ...change } } };
        }),
      remove: (id) => set((state) => ({ deleted: [...state.deleted, id] })),
      comment: (postId, item) =>
        set((state) => {
          const target = listPosts().find((post) => post.id === postId);

          if (!target) return state;

          const comments = [...target.comments, item];

          if (state.created.some((post) => post.id === postId)) {
            return { created: state.created.map((post) => (post.id === postId ? { ...post, comments } : post)) };
          }

          return { patched: { ...state.patched, [postId]: { ...state.patched[postId], comments } } };
        }),
      dismissPopup: (id) => set((state) => ({ dismissedPopups: [...state.dismissedPopups, id] })),
      nextId: () => `BD-${String(1100 + get().created.length)}`,
    }),
    {
      name: 'cne-board',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * 시드와 사용자 글을 합친 목록. 고정 글이 위로 온다.
 * 화면은 스토어 필드를 구독한 뒤 이 순수 함수를 호출한다 —
 * 실제 API 로 갈 때는 이 함수 안만 갈아 끼우면 된다.
 */
export function mergePosts(
  created: BoardPost[],
  patched: Record<string, Partial<BoardPost>>,
  deleted: string[],
): BoardPost[] {
  return [...created, ...SEED_POSTS]
    .filter((post) => !deleted.includes(post.id))
    .map((post) => ({ ...post, ...patched[post.id] }))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.at.localeCompare(a.at));
}

export function listPosts(): BoardPost[] {
  const { created, patched, deleted } = useBoardStore.getState();

  return mergePosts(created, patched, deleted);
}

export function getPost(id: string): BoardPost | null {
  return listPosts().find((post) => post.id === id) ?? null;
}

/** 지금 띄울 팝업 공지 (SFR-025-02/03) */
export function activePopups(): BoardPost[] {
  const today = TODAY.format('YYYY-MM-DD');
  const { dismissedPopups } = useBoardStore.getState();

  return listPosts().filter(
    (post) =>
      post.popup !== null
      && post.popup.start <= today
      && post.popup.end >= today
      && !dismissedPopups.includes(post.id),
  );
}

export default useBoardStore;
