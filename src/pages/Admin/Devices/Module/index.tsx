import { useSearchParams } from 'react-router-dom';
import type { AdminDepth } from '@/pages/Admin/_shared/adminPath';
import { ModuleBoard } from './components/ModuleBoard';
import { ModuleEditor } from './components/ModuleEditor';

/** 모듈 제품 마스터 (SFR-017-05) — 설비 등록에서 고를 모델 카탈로그다. */
function ModuleDepth({ depth }: { depth: AdminDepth }) {
  const [params] = useSearchParams();

  // 주소에 번호가 없으면 새로 세우는 자리다.
  if (depth === 'form') return <ModuleEditor moduleId={Number(params.get('moduleId')) || null} />;

  return <ModuleBoard />;
}

export default ModuleDepth;
