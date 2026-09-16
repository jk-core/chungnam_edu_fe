import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserInfoByToken } from '@/service/auth';
import useAuthStore, { toAuthUser, useSetAuthUser } from '@/stores/authStore';

export const SESSION_USER_KEY = ['user', 'token'] as const;

/**
 * 토큰이 가리키는 계정을 다시 확인한다 (`/user/token/Info`).
 *
 * 스토어에 담아 둔 계정은 로그인하던 때의 사진이다 — 그 뒤 관리자가 등급을 낮췄어도 브라우저를
 * 닫았다 열기 전까지는 옛 등급으로 메뉴가 열린다. 그래서 세션이 살아 있는 동안 한 번은 맞대 본다.
 *
 * 토큰이 죽었으면 조회가 401 로 떨어지고, 인터셉터가 재발급을 거쳐 세션을 정리한다 —
 * 여기서 따로 로그아웃시키지 않는다.
 */
export function useSessionUser() {
  const session = useAuthStore((state) => state.session);
  const setUser = useSetAuthUser();

  const { data } = useQuery({
    queryKey: SESSION_USER_KEY,
    queryFn: getUserInfoByToken,
    enabled: session !== null,
    // 등급이 바뀌는 일은 드물다. 화면을 옮길 때마다 물을 값이 아니다.
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (!data) return;

    setUser(toAuthUser(data));
  }, [data, setUser]);
}
