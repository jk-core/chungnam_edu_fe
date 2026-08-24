import { useSearchParams } from 'react-router-dom';
import type { AdminDepth } from '@/pages/Admin/_shared/adminPath';
import { UserEditor } from './components/UserEditor';
import { UsersBoard } from './components/UsersBoard';

/** 사용자 등록·수정 (SFR-018) */
function AccountDepth({ depth }: { depth: AdminDepth }) {
  const [params] = useSearchParams();

  // 주소에 번호가 없으면 새 계정을 세우는 자리다.
  if (depth === 'form') return <UserEditor userId={Number(params.get('userId')) || null} />;

  return <UsersBoard />;
}

export default AccountDepth;
