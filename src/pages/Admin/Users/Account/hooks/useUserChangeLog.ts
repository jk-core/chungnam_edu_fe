import { entry } from '@/pages/Admin/_shared/changeLog';
import { useAuthUser } from '@/stores/authStore';
import type { ChangeLog } from '@/interface/changeLog';
import type { ManagedUser } from '@/interface/account';

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
  ): ChangeLog => entry(
    { targetType: 'user', id: target.id, name: target.name, actor: actor?.name ?? '관리자' },
    field,
    before,
    after,
  );
}
