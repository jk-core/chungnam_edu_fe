import { useSearchParams } from 'react-router-dom';
import type { AdminDepth } from '@/pages/Admin/_shared/adminPath';
import { StringBoard } from './components/StringBoard';
import { StringSheet } from './components/StringSheet';

/** 스트링 관리 (SFR-016-01, SFR-017-06) — 설비 한 대의 스트링을 한 판에서 다룬다. */
function StringDepth({ depth }: { depth: AdminDepth }) {
  const [params] = useSearchParams();

  // 주소에 설비 CID 가 없으면 설비부터 고르는 자리다.
  if (depth === 'form') return <StringSheet cid={Number(params.get('cid')) || null} />;

  return <StringBoard />;
}

export default StringDepth;
