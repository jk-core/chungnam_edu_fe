import { useSearchParams } from 'react-router-dom';
import type { AdminDepth } from '@/pages/Admin/_shared/adminPath';
import { PlantEditor } from './components/PlantEditor';
import { PlantsBoard } from './components/PlantsBoard';

/** 발전소 등록·수정 (SFR-016-01~04/06) */
function PlantDepth({ depth }: { depth: AdminDepth }) {
  const [params] = useSearchParams();

  // 주소에 번호가 없으면 새로 세우는 자리다.
  if (depth === 'form') return <PlantEditor powerPlantId={Number(params.get('powerPlantId')) || null} />;

  return <PlantsBoard />;
}

export default PlantDepth;
