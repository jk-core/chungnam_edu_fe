import type { BoardKind } from '@/interface/board';
import { PostForm } from '../components/PostForm';

/** 글쓰기 뎁스 (SFR-025-01). 무엇을 쓰는지는 들어온 게시판이 정한다. */
function WritePage({ kind }: { kind: BoardKind }) {
  return <PostForm kind={kind} />;
}

export default WritePage;
