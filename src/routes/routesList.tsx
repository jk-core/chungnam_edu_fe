import { Navigate, useParams } from 'react-router-dom';
import { lazy } from 'react';
import { buildPath } from './buildPath';
import { PATH } from './routes';
import type { RouteObject } from 'react-router-dom';

/*
  ⚠️ 시연용 라우터 (2026-09-09 지시) — 이 파일만 되돌리면 원래 사이트맵으로 돌아온다.

  통합관제와 교육용 대시보드 시안 셋만 열어 두고 나머지 길을 모두 막는다. 막힌 주소로 들어오면
  전부 `/preview-choice` 로 모이므로, 시연 중에 주소를 잘못 짚어도 빈 화면을 만나지 않는다.

  로그인 게이트도 함께 걷었다. `/control` 은 원래 `RequireAuth` 뒤에 있었는데, 로그인 화면까지
  막아 둔 마당에 게이트를 남기면 통합관제로 들어갈 길이 아예 없어진다.

  **`PATH` 와 페이지 파일은 지우지 않았다.** 발전관리·AI진단·이용안내·관리자 콘솔은 그대로 있고
  길만 끊어 둔 것이라, 시연이 끝나면 이 파일을 이전 버전으로 되돌리는 것으로 끝난다.
  되돌릴 자리: `git log --oneline -- src/routes/routesList.tsx` 에서 이 커밋 바로 앞.
*/

const SolarEduPage = lazy(() => import('@/pages/SolarEdu'));
const ControlRoomPage = lazy(() => import('@/pages/ControlRoom'));
const PreviewChoicePage = lazy(() => import('@/pages/PreviewChoice'));

/** 시안 이름이 빠진 `/solar-edu/:orgId` 를 같은 학교의 첫 시안으로 넘긴다. */
function SolarEduRedirect() {
  const { orgId } = useParams<{ orgId: string }>();

  return <Navigate to={orgId ? buildPath.solarEdu(orgId) : PATH.SOLAR_EDU_A} replace />;
}

export const routes: RouteObject[] = [
  { path: PATH.PREVIEW_CHOICE, element: <PreviewChoicePage /> },

  // 통합관제 상황판 — 헤더·LNB 없이 화면을 다 쓴다.
  { path: PATH.CONTROL, element: <ControlRoomPage /> },

  /*
    교육용 대시보드 시안 셋. 시안 주소를 학교 주소(`/solar-edu/:orgId`)보다 **먼저** 세운다 —
    라우터가 고정 조각을 변수 조각보다 앞에 두긴 하지만, 읽는 사람에게도 a·b·c 가 학교 id 가
    아니라는 것이 보여야 한다.
  */
  { path: PATH.SOLAR_EDU_A, element: <SolarEduPage variant="a" /> },
  { path: `${PATH.SOLAR_EDU_A}/:orgId`, element: <SolarEduPage variant="a" /> },
  { path: PATH.SOLAR_EDU_B, element: <SolarEduPage variant="b" /> },
  { path: `${PATH.SOLAR_EDU_B}/:orgId`, element: <SolarEduPage variant="b" /> },
  { path: PATH.SOLAR_EDU_C, element: <SolarEduPage variant="c" /> },
  { path: `${PATH.SOLAR_EDU_C}/:orgId`, element: <SolarEduPage variant="c" /> },

  // 시안 이름이 없는 주소는 첫 시안으로. 모니터에 이미 걸린 URL 이 있을 수 있다.
  { path: PATH.SOLAR_EDU, element: <Navigate to={PATH.SOLAR_EDU_A} replace /> },
  { path: `${PATH.SOLAR_EDU}/:orgId`, element: <SolarEduRedirect /> },

  // 나머지는 전부 고르는 자리로. 메인(`/`)과 로그인도 여기에 걸린다.
  { path: '*', element: <Navigate to={PATH.PREVIEW_CHOICE} replace /> },
];
