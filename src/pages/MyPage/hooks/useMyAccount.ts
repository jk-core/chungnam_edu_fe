import { useQuery } from '@tanstack/react-query';
import { getUserInfo } from '@/service/auth';
import { toAuthUser, useAuthUser } from '@/stores/authStore';
import type { AuthUser } from '@/interface/account';

export const MY_ACCOUNT_KEY = ['user', 'info'] as const;

/**
 * 마이페이지가 그리는 계정 (SFR-024).
 *
 * 스토어에 든 것을 먼저 보여 주고 조회가 돌아오면 갈아 끼운다 — 계정 정보는 헤더가 이미 쥐고
 * 있는 값이라, 카드가 비었다가 채워지면 같은 이름이 두 번 나타난다.
 */
export function useMyAccount(): { user: AuthUser | null; isLoading: boolean } {
  const cached = useAuthUser();

  const { data, isLoading } = useQuery({
    queryKey: MY_ACCOUNT_KEY,
    queryFn: getUserInfo,
    staleTime: 5 * 60 * 1000,
  });

  const user: AuthUser | null = data ? toAuthUser(data) : cached;

  return { user, isLoading: isLoading && cached === null };
}
