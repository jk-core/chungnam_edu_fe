import { useSearchParams } from 'react-router-dom';
import type { AdminDepth } from '@/pages/Admin/_shared/adminPath';
import { GroupBoard } from './components/GroupBoard';
import { GroupEditor } from './components/GroupEditor';

/** 그룹관리자 관리 (SFR-018, SFR-023) — 한 사람이 맡은 발전소 묶음을 다룬다. */
function GroupDepth({ depth }: { depth: AdminDepth }) {
  const [params] = useSearchParams();

  // 주소에 번호가 없으면 새 그룹관리자를 세우는 자리다.
  if (depth === 'form') return <GroupEditor userId={Number(params.get('userId')) || null} />;

  return <GroupBoard />;
}

export default GroupDepth;
