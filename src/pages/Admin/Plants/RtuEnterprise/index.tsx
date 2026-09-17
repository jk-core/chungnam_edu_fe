import { useSearchParams } from 'react-router-dom';
import type { AdminDepth } from '@/pages/Admin/_shared/adminPath';
import { RtuEnterpriseBoard } from './components/RtuEnterpriseBoard';
import { RtuEnterpriseEditor } from './components/RtuEnterpriseEditor';

/** RTU 업체 관리 (SFR-016-01) — 발전소 등록에서 고를 업체 목록이다. */
function RtuEnterpriseDepth({ depth }: { depth: AdminDepth }) {
  const [params] = useSearchParams();

  // 주소에 번호가 없으면 새로 세우는 자리다.
  if (depth === 'form') {
    return <RtuEnterpriseEditor rtuEnterpriseId={Number(params.get('rtuEnterpriseId')) || null} />;
  }

  return <RtuEnterpriseBoard />;
}

export default RtuEnterpriseDepth;
