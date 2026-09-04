import { PostList } from '../components/PostList';

/** 문의하기 목록 (SFR-025) — 누구나 묻고 담당자가 댓글로 답한다. */
function InquiryPage() {
  return <PostList kind="inquiry" />;
}

export default InquiryPage;
