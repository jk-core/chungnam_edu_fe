import { PostList } from '../components/PostList';

/** Q&A 목록 (SFR-025) — 누구나 묻고 담당자가 댓글로 답한다. */
function QnaPage() {
  return <PostList kind="qna" />;
}

export default QnaPage;
