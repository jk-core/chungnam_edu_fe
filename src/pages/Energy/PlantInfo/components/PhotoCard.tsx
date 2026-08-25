import { Card } from '@/components/common/Card';
import { PlantPhotos } from '@/components/plant/PlantPhotos';
import { Reveal } from '@/components/common/Reveal';
import type { PlantInfoView } from '../hooks/usePlantInfoView';

/**
 * 현장 사진 (SFR-016-01).
 *
 * 제원표가 답하지 못하는 것을 답한다 — 모듈이 지붕에 누웠는지 캐노피에 얹혔는지, 주변에
 * 그늘을 만들 나무나 건물이 있는지는 숫자로 적히지 않는다. 발전량이 낮은 이유를 찾을 때
 * 가장 먼저 보게 되는 자리라 제원 위에 세운다.
 */
export function PhotoCard({ view }: { view: PlantInfoView }) {
  const { plant } = view;

  if (!plant) return null;

  return (
    <Reveal delay={0.06}>
      <Card title="현장 사진" description="설치 현장을 찍은 사진입니다.">
        <PlantPhotos plantId={plant.id} />
      </Card>
    </Reveal>
  );
}
