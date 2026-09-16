import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isOpenInPreview, ONLY_PREVIEW } from '@/routes/previewMode';
import { PATH } from '@/routes/routes';
import type { Role } from '@/interface/account';
import { RequireAuth } from './RequireAuth';

interface PreviewGateProps {
  /** 평소에 이 구역을 지키는 역할. 공개 모드에서는 보지 않는다. */
  roles?: Role[];
}

/**
 * 시연용 공개 모드의 문지기 (2026-09-16 지시).
 *
 * 평소에는 `RequireAuth` 그대로다 — 로그인을 묻고 역할을 가린다. `VITE_ONLY_PREVIEW` 가
 * 켜지면 **열어 둔 자리는 로그인 없이 통과**시키고 나머지는 화면 고르개로 보낸다.
 *
 * 인증 구역마다 조건문을 흩어 놓지 않고 문지기 하나를 갈아 끼우는 까닭은, 라우트 표가 공개
 * 모드를 몰라도 되게 하려는 것이다. 표에는 어느 화면이 어디에 서는지만 적히고, 그것을 누구에게
 * 보일지는 이 한 곳에서 정한다 — 시연이 끝나면 `VITE_ONLY_PREVIEW` 를 지우는 것으로 끝난다.
 *
 * 막힌 자리를 로그인 화면이 아니라 고르개로 보내는 것도 같은 까닭이다. 시연 자리에서 주소를
 * 잘못 짚었을 때 계정을 묻는 화면을 만나면 그 자리에서 시연이 멈춘다.
 */
export function PreviewGate({ roles }: PreviewGateProps) {
  const { pathname } = useLocation();

  if (!ONLY_PREVIEW) return <RequireAuth roles={roles} />;

  return isOpenInPreview(pathname) ? <Outlet /> : <Navigate to={PATH.PREVIEW_CHOICE} replace />;
}
