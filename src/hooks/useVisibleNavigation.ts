import { useMemo } from 'react';
import { ADMIN_NAVIGATION, visibleNavigation } from '@/configs/navigation';
import { isAdminRole } from '@/mocks/accounts';
import { useAuthUser } from '@/stores/authStore';
import type { NavSection } from '@/configs/navigation';

/**
 * 로그인한 역할이 볼 수 있는 대메뉴.
 * findSection/findChild 는 전체 목록을 계속 대상으로 삼는다 — 차단은 라우트 가드가 맡고, 여기서는 표시만 걸러 낸다.
 */
export function useVisibleNavigation(): NavSection[] {
  const user = useAuthUser();

  return useMemo(() => visibleNavigation(user?.role ?? null), [user?.role]);
}

/** 관리자 콘솔 메뉴. 권한이 없으면 빈 배열이다. */
export function useAdminNavigation(): NavSection | null {
  const user = useAuthUser();

  return isAdminRole(user?.role) ? ADMIN_NAVIGATION : null;
}
