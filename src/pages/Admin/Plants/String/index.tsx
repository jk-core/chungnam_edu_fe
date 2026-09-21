import { Navigate, useSearchParams } from 'react-router-dom';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import type { AdminDepth } from '@/pages/Admin/_shared/adminPath';
import { StringBoard } from './components/StringBoard';
import { StringSheet } from './components/StringSheet';

/** 스트링 관리 (SFR-016-01, SFR-017-06) — 설비 한 대의 스트링을 한 판에서 다룬다. */
function StringDepth({ depth }: { depth: AdminDepth }) {
  const [params] = useSearchParams();
  const cid = Number(params.get('cid')) || null;

  if (depth === 'form') {
    // 스트링은 설비에 딸리므로 대상 없이 여는 자리가 없다 — 목록에서 설비를 골라 들어온다.
    return cid === null ? <Navigate to={listPath('plants', 'string')} replace /> : <StringSheet cid={cid} />;
  }

  return <StringBoard />;
}

export default StringDepth;
