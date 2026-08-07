import { Navigate, useParams } from 'react-router-dom';
import { PATH } from '@/routes/routes';
import { BoardTab } from '@/pages/Reports/components/BoardTab';

/**
 * 이용안내 — 공지사항·Q&A.
 * 두 화면 모두 같은 게시판을 쓰고, 들어온 주소로 첫 분류만 갈라 준다 (SFR-025).
 */
const KINDS = { notice: 'notice', qna: 'qna' } as const;

type TabKey = keyof typeof KINDS;

function GuidePage() {
  const { tab } = useParams<{ tab: string }>();

  if (!tab || !(tab in KINDS)) return <Navigate to={PATH.GUIDE_NOTICE} replace />;

  return <BoardTab initialKind={KINDS[tab as TabKey]} />;
}

export default GuidePage;
