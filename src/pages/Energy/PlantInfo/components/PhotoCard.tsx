import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { PlantPhotos } from '@/components/plant/PlantPhotos';
import { Reveal } from '@/components/common/Reveal';
import type { PlantInfoView } from '../hooks/usePlantInfoView';

/**
 * 현장 사진 (SFR-016-01).
 *
 * 제원표가 답하지 못하는 것을 답한다 — 모듈이 지붕에 누웠는지 캐노피에 얹혔는지, 주변에
 * 그늘을 만들 나무나 건물이 있는지는 숫자로 적히지 않는다. 발전량이 낮은 이유를 찾을 때
 * 가장 먼저 보게 되는 자리라 제원 위에 세운다.
 *
 * 사진이 없어도 카드를 숨기지 않는다 — 카드가 사라지면 「사진이 없는 것」과 「이 화면에
 * 사진 자리가 없는 것」을 가릴 수 없고, 발전소마다 카드 순서가 달라 보인다.
 */
export function PhotoCard({ view }: { view: PlantInfoView }) {
  const { plant, asset } = view;

  if (!plant) return null;

  const photos = asset?.photos ?? [];

  return (
    <Reveal delay={0.06}>
      <Card title="현장 사진" description="설치 현장을 찍은 사진입니다.">
        {photos.length === 0 ? (
          <EmptyState
            title="등록된 현장 사진이 없습니다"
            description="발전소 관리에서 대표이미지를 올릴 수 있습니다."
          />
        ) : (
          <PlantPhotos photos={photos} plantName={plant.name} />
        )}
      </Card>
    </Reveal>
  );
}
