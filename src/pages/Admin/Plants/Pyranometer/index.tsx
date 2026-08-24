import { useSearchParams } from 'react-router-dom';
import type { AdminDepth } from '@/pages/Admin/_shared/adminPath';
import { PyranometerBoard } from './components/PyranometerBoard';
import { PyranometerEditor } from './components/PyranometerEditor';

/** 일사량계(환경센서) 관리 (SFR-016-01/05) — 발전소마다 한 대가 기본이다. */
function PyranometerDepth({ depth }: { depth: AdminDepth }) {
  const [params] = useSearchParams();

  // 주소에 번호가 없으면 새로 세우는 자리다.
  if (depth === 'form') return <PyranometerEditor irradId={Number(params.get('irradId')) || null} />;

  return <PyranometerBoard />;
}

export default PyranometerDepth;
