import { entry } from '@/pages/Admin/_shared/changeLog';
import { useAuthUser } from '@/stores/authStore';
import type { ChangeLog } from '@/interface/changeLog';

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
  ): ChangeLog => entry(
    { targetType: 'powerPlant', id: plant.id, name: plant.name, actor: actor?.name ?? '관리자' },
    field,
    before,
    after,
  );
}
