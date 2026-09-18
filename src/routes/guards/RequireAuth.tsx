import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { hasRole, useAuthUser } from '@/stores/authStore';
import { PATH } from '@/routes/routes';
import { useSessionUser } from '@/hooks/useSessionUser';
import type { Role } from '@/interface/account';

interface RequireAuthProps {
  /** 비우면 로그인만 확인한다. 채우면 그 역할만 통과시킨다. */
  roles?: Role[];
}

/**
 * 로그인·권한 게이트.
 *
 * loader 대신 컴포넌트로 둔다 — 스토어를 구독해 로그아웃과 토큰 만료가 곧바로 반영된다.
 * 세션 유지시간은 서버가 쥔다: 토큰이 죽으면 인터셉터가 재발급을 거쳐 세션을 정리하고,
 * 그 순간 이 가드가 로그인 화면으로 보낸다.
 */
export function RequireAuth({ roles }: RequireAuthProps) {
  const user = useAuthUser();
  const { pathname } = useLocation();

  // 담아 둔 계정은 로그인하던 때의 사진이라, 살아 있는 동안 한 번은 토큰과 맞대 본다.
  useSessionUser();

  // 로그인 후 원래 가려던 곳으로 되돌려 보내려 경로를 실어 보낸다.
  if (!user) return <Navigate to={PATH.LOGIN} state={{ from: pathname }} replace />;

  if (!hasRole(user, roles)) return <Navigate to={PATH.HOME} replace />;

  return <Outlet />;
}
