import type { BoardKind } from '@/interface/board';
import { PostView } from '../components/PostView';

/** 글 하나를 펼치는 뎁스 (SFR-025-04). 어느 게시판인지는 위에서 받아 온다. */
function DetailPage({ kind }: { kind: BoardKind }) {
  return <PostView kind={kind} />;
}

export default DetailPage;
