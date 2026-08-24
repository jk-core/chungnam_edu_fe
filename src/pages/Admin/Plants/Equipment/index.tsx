import { useSearchParams } from 'react-router-dom';
import type { AdminDepth } from '@/pages/Admin/_shared/adminPath';
import { EquipmentBoard } from './components/EquipmentBoard';
import { EquipmentEditor } from './components/EquipmentEditor';

/** 설비 관리 (SFR-016-01, SFR-017-04) — 등록 정보만 다룬다. 운영 상태는 통합관제·AI진단에서 본다. */
function EquipmentDepth({ depth }: { depth: AdminDepth }) {
  const [params] = useSearchParams();

  // 주소에 CID 가 없으면 새로 세우는 자리다.
  if (depth === 'form') return <EquipmentEditor cid={Number(params.get('cid')) || null} />;

  return <EquipmentBoard />;
}

export default EquipmentDepth;
