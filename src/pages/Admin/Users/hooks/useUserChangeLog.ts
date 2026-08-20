import { NOW } from '@/mocks/today';
import { useAuthUser } from '@/stores/authStore';
import type { ManagedUser, UserChange } from '@/interface/account';

/**
 * 담당자 변경 이력 한 줄 만들기 (SFR-018-04).
 * 저장·잠금해제·삭제가 같은 형식을 쓰므로 만드는 자리도 하나로 둔다.
 */
export function useUserChangeLog() {
  const actor = useAuthUser();

  return (
    target: Pick<ManagedUser, 'id' | 'name'>,
    field: string,
    before: string,
    after: string,
    /** 한 번에 여러 줄을 남길 때 서로 다른 id 를 갖게 하는 번호 */
    seq = 0,
  ): UserChange => ({
    id: `UC-${NOW.format('MMDDHHmm')}-${target.id}-${seq}`,
    userId: target.id,
    userName: target.name,
    at: NOW.format('YYYY-MM-DD HH:mm'),
    actor: actor?.name ?? '관리자',
    field,
    before,
    after,
  });
}
