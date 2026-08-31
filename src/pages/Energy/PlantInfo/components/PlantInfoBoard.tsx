import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { usePlantInfoView } from '../hooks/usePlantInfoView';
import styles from '../PlantInfo.module.scss';
import { EquipmentCard } from './EquipmentCard';
import { PhotoCard } from './PhotoCard';
import { PlantSummaryCard } from './PlantSummaryCard';
import { RegistryCard } from './RegistryCard';
import { SensorCard } from './SensorCard';

/**
 * 발전소 정보 본문.
 *
 * 값은 여기서 한 번만 모아 네 카드에 내려보낸다 — 카드마다 따로 읽으면 같은 화면 안에서
 * 인버터 대수나 합계 용량이 갈린다.
 *
 * 발전량 추이와 진단 결과는 담지 않는다. 그쪽은 발전통계와 AI진단이 이미 맡고 있고,
 * 여기서 다시 그리면 같은 값을 두 화면이 서로 다르게 말하게 된다.
 */
export function PlantInfoBoard() {
  const view = usePlantInfoView();

  if (!view.plant) {
    return (
      <Card padding="none">
        <EmptyState
          title="발전소를 골라 주세요"
          description="좌측 조회 대상에서 발전소를 고르면 그 발전소의 제원과 설비 구성을 폅니다."
        />
      </Card>
    );
  }

  return (
    <div className={styles.tab}>
      <PlantSummaryCard view={view} />
      <PhotoCard view={view} />
      <RegistryCard view={view} />
      <EquipmentCard view={view} />
      <SensorCard view={view} />
    </div>
  );
}
