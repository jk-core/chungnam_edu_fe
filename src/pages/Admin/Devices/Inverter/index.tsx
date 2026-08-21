import { useSearchParams } from 'react-router-dom';
import type { AdminDepth } from '@/pages/Admin/_shared/adminPath';
import { InverterBoard } from './components/InverterBoard';
import { InverterEditor } from './components/InverterEditor';

/** 인버터 제품 마스터 (SFR-017-04) — 설비 등록에서 고를 모델 카탈로그다. */
function InverterDepth({ depth }: { depth: AdminDepth }) {
  const [params] = useSearchParams();

  // 주소에 번호가 없으면 새로 세우는 자리다.
  if (depth === 'form') return <InverterEditor inverterId={Number(params.get('inverterId')) || null} />;

  return <InverterBoard />;
}

export default InverterDepth;
