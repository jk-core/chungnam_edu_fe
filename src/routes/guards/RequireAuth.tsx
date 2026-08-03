import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { PATH } from '@/routes/routes';
import useAuthStore, { hasRole, useAuthUser } from '@/stores/authStore';
import type { Role } from '@/interface/account';

interface RequireAuthProps {
  /** 비우면 로그인만 확인한다. 채우면 그 역할만 통과시킨다. */
  roles?: Role[];
}

/**
 * 로그인·권한 게이트.
 * loader 대신 컴포넌트로 둔다 — 목업이라 서버 왕복이 없고, 스토어를 구독해 로그아웃이 곧바로 반영된다.
 */
export function RequireAuth({ roles }: RequireAuthProps) {
  const user = useAuthUser();
  const { pathname } = useLocation();

  // 조작이 있으면 세션을 늘린다. 스토어가 남은 시간을 보고 알아서 걸러 낸다.
  useEffect(() => {
    const touch = () => useAuthStore.getState().touchSession();

    window.addEventListener('pointerdown', touch);
    window.addEventListener('keydown', touch);

    return () => {
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('keydown', touch);
    };
  }, []);

  // 로그인 후 원래 가려던 곳으로 되돌려 보내려 경로를 실어 보낸다.
  if (!user) return <Navigate to={PATH.LOGIN} state={{ from: pathname }} replace />;

  if (!hasRole(user, roles)) return <Navigate to={PATH.HOME} replace />;

  return <Outlet />;
}
