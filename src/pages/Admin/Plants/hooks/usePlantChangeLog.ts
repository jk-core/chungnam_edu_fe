import { NOW } from '@/mocks/today';
import { useAuthUser } from '@/stores/authStore';
import type { AssetChange } from '@/interface/asset';

/**
 * 발전소 변경 이력 한 줄 만들기 (SFR-016-06).
 * 등록·수정·삭제가 같은 형식을 쓰므로 만드는 자리도 하나로 둔다.
 */
export function usePlantChangeLog() {
  const actor = useAuthUser();

  return (
    plant: { id: string; name: string },
    field: string,
    before: string,
    after: string,
    /** 한 번에 여러 줄을 남길 때 서로 다른 id 를 갖게 하는 꼬리 */
    suffix: string | number = '',
  ): AssetChange => ({
    id: `AC-${NOW.format('MMDDHHmm')}-${plant.id}${suffix === '' ? '' : `-${suffix}`}`,
    plantId: plant.id,
    plantName: plant.name,
    at: NOW.format('YYYY-MM-DD HH:mm'),
    actor: actor?.name ?? '관리자',
    field,
    before,
    after,
  });
}
