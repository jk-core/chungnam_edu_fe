import { Navigate, useParams } from 'react-router-dom';
import { PATH } from '@/routes/routes';
import type { BoardKind } from '@/interface/board';
import DetailPage from './Detail';
import NoticePage from './Notice';
import InquiryPage from './Inquiry';
import WritePage from './Write';

/**
 * 이용안내 — 공지사항·문의하기 (SFR-025).
 *
 * 두 게시판은 저마다 선 화면이다. 한 목록에 섞어 필터로 갈라 보면 무엇을 보고 있는지가
 * 화면 안의 상태에 달려 있어, 주소를 주고받아도 같은 화면이 열리지 않는다.
 *
 * 뎁스는 목록 → 글 하나, 그리고 글쓰기 셋이고 각자 제 폴더에 있다.
 * 이 파일은 주소를 보고 어느 게시판의 어느 뎁스를 세울지만 고른다.
 */
const LISTS: Record<BoardKind, () => React.JSX.Element> = {
  notice: NoticePage,
  inquiry: InquiryPage,
};

type Depth = 'list' | 'detail' | 'write' | 'edit';

interface GuidePageProps {
  /** 목록 아래로 한 단 더 들어간 자리. 주소에 `:postId` 나 `write` 가 붙는다. */
  depth?: Depth;
}

function GuidePage({ depth = 'list' }: GuidePageProps) {
  const { tab } = useParams<{ tab: string }>();

  if (!tab || !(tab in LISTS)) return <Navigate to={PATH.GUIDE_NOTICE} replace />;

  const kind = tab as BoardKind;

  if (depth === 'detail') return <DetailPage kind={kind} />;
  if (depth === 'write' || depth === 'edit') return <WritePage kind={kind} />;

  const List = LISTS[kind];

  return <List />;
}

export default GuidePage;
