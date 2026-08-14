import { PostList } from '../components/PostList';

/** 공지사항 목록 (SFR-025) — 교육청이 알리는 글만 여기 실린다. */
function NoticePage() {
  return <PostList kind="notice" />;
}

export default NoticePage;
