import { Navigate, useParams } from 'react-router-dom';
import { lazy } from 'react';
import { ADMIN_ROLES } from '@/mocks/accounts';
import AuthLayout from '@/layouts/AuthLayout';
import RootLayout from '@/layouts/RootLayout';
import SubPageLayout from '@/layouts/SubPageLayout';
import HomePage from '@/pages/Home';
import { PreviewGate } from './guards/PreviewGate';
import { ONLY_PREVIEW } from './previewMode';
import { buildPath } from './buildPath';
import { PATH } from './routes';
import type { RouteObject } from 'react-router-dom';

// 차트 라이브러리를 함께 들고 오는 화면들은 첫 화면 번들에서 떼어 낸다.
const EnergyPage = lazy(() => import('@/pages/Energy'));
const GuidePage = lazy(() => import('@/pages/Guide'));
const AiDiagnosisPage = lazy(() => import('@/pages/AiDiagnosis'));
const MyPage = lazy(() => import('@/pages/MyPage'));
const LoginPage = lazy(() => import('@/pages/Login'));
const SolarEduPage = lazy(() => import('@/pages/SolarEdu'));
const ControlRoomPage = lazy(() => import('@/pages/ControlRoom'));
const ControlRoomDraftPage = lazy(() => import('@/pages/ControlRoom/drafts'));
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const AdminPage = lazy(() => import('@/pages/Admin'));
const PreviewChoicePage = lazy(() => import('@/pages/PreviewChoice'));

/** 옛 `/kiosk/:orgId` 를 같은 학교의 교육 화면으로 넘긴다. */
function KioskRedirect() {
  const { orgId } = useParams<{ orgId: string }>();

  return <Navigate to={orgId ? buildPath.solarEdu(orgId) : PATH.SOLAR_EDU_A} replace />;
}

/** 시안 이름이 빠진 `/solar-edu/:orgId` 를 같은 학교의 첫 시안으로 넘긴다. */
function SolarEduRedirect() {
  const { orgId } = useParams<{ orgId: string }>();

  return <Navigate to={orgId ? buildPath.solarEdu(orgId) : PATH.SOLAR_EDU_A} replace />;
}

export const routes: RouteObject[] = [
  /*
    시연용 화면 고르개 — 공개 모드에서만 선다 (`VITE_ONLY_PREVIEW`).
    끌 때 이 줄까지 함께 사라지므로, 평소 라우트에는 없는 주소가 된다.
  */
  ...(ONLY_PREVIEW ? [{ path: PATH.PREVIEW_CHOICE, element: <PreviewChoicePage /> }] : []),
  {
    element: <AuthLayout />,
    children: [{ path: PATH.LOGIN, element: <LoginPage /> }],
  },
  // 교육용 대시보드는 모니터에 걸어 두고 조작 없이 돌리는 화면이라 로그인을 요구하지 않는다 (SFR-005-08).
  // 세션이 만료됐다고 복도 모니터가 로그인 화면으로 튕기면 안 된다.
  /*
    시안 주소를 학교 주소(`/solar-edu/:orgId`)보다 **먼저** 세운다.
    라우터가 고정 조각을 변수 조각보다 앞에 두긴 하지만, 읽는 사람에게도 a·b·c 가
    학교 id 가 아니라는 것이 보여야 한다. 학교 id 는 `천안-1` 꼴이라 겹칠 일도 없다.
  */
  { path: PATH.SOLAR_EDU_A, element: <SolarEduPage variant="a" /> },
  { path: `${PATH.SOLAR_EDU_A}/:orgId`, element: <SolarEduPage variant="a" /> },
  { path: PATH.SOLAR_EDU_B, element: <SolarEduPage variant="b" /> },
  { path: `${PATH.SOLAR_EDU_B}/:orgId`, element: <SolarEduPage variant="b" /> },
  { path: PATH.SOLAR_EDU_C, element: <SolarEduPage variant="c" /> },
  { path: `${PATH.SOLAR_EDU_C}/:orgId`, element: <SolarEduPage variant="c" /> },
  /*
    시안 이름이 없는 주소는 첫 시안으로 넘긴다.
    셋을 대등하게 두기로 한 뒤로 「이름 없는 현행」 이 사라졌는데, 모니터에 이미 걸린 URL 이
    있을 수 있어 길만 열어 둔다.
  */
  { path: PATH.SOLAR_EDU, element: <Navigate to={PATH.SOLAR_EDU_A} replace /> },
  { path: `${PATH.SOLAR_EDU}/:orgId`, element: <SolarEduRedirect /> },
  // 교육용 화면을 하나로 합치기 전 주소. 모니터에 이미 걸린 URL 이 있을 수 있어 넘겨만 준다.
  { path: PATH.KIOSK, element: <Navigate to={PATH.SOLAR_EDU_A} replace /> },
  { path: `${PATH.KIOSK}/:orgId`, element: <KioskRedirect /> },
  {
    // 로그인하지 않으면 아래 화면 전부 막힌다.
    element: <PreviewGate />,
    children: [
      // 통합관제 상황판은 운영자용이라 로그인은 받되, 헤더·LNB 없이 화면을 다 쓴다.
      { path: PATH.CONTROL, element: <ControlRoomPage /> },
      // 배치 시안. 보여 주는 값과 판은 같고 어디에 세우는지·무슨 색인지만 다르다.
      { path: PATH.CONTROL_B, element: <ControlRoomDraftPage draft="b" /> },
      { path: PATH.CONTROL_C, element: <ControlRoomDraftPage draft="c" /> },
      {
        path: PATH.HOME,
        element: <RootLayout />,
        children: [
          { index: true, element: <HomePage /> },
          // 대메뉴에 속하지 않는 단독 화면
          { path: 'my', element: <MyPage /> },
          {
            element: <SubPageLayout />,
            children: [
              { path: 'energy/:tab', element: <EnergyPage /> },
              /*
               * 발전통계는 조회 뎁스를 주소로 관리한다 — 발전소 한 단, 인버터 한 단.
               * 주소만 주고받아도 같은 화면이 열리고, 뒤로 가기가 조회 단계를 되짚는다.
               * 인버터 아래(스트링)는 AI진단 몫이라 여기서는 열지 않는다.
               */
              { path: 'energy/statistics/:plantId', element: <EnergyPage tab="statistics" /> },
              { path: 'energy/statistics/:plantId/:inverterId', element: <EnergyPage tab="statistics" /> },
              { path: 'ai-diagnosis/:tab', element: <AiDiagnosisPage /> },
              /*
                발전진단도 조회 뎁스를 주소에 남긴다 — 발전소·인버터·그 아래 회로가 각자 주소를 갖는다.
                `:tab` 하나로는 이 자리들이 잡히지 않아 따로 등록한다 (SFR-013).
              */
              { path: 'ai-diagnosis/overview/:plantId', element: <AiDiagnosisPage tab="overview" /> },
              { path: 'ai-diagnosis/overview/:plantId/:inverterId', element: <AiDiagnosisPage tab="overview" /> },
              {
                path: 'ai-diagnosis/overview/:plantId/:inverterId/:unitId',
                element: <AiDiagnosisPage tab="overview" />,
              },
              { path: 'guide/:tab', element: <GuidePage /> },
              /*
                게시판도 목록 아래로 한 단 더 내려간다 — 글쓰기와 글 하나가 저마다 주소를 갖는다.
                `write` 를 먼저 두어 글 번호로 읽히지 않게 한다 (SFR-025).
              */
              { path: 'guide/:tab/write', element: <GuidePage depth="write" /> },
              { path: 'guide/:tab/:postId/edit', element: <GuidePage depth="edit" /> },
              { path: 'guide/:tab/:postId', element: <GuidePage depth="detail" /> },
            ],
          },
          {
            // 관리자 콘솔은 내부망 전용이고 관리자 역할만 통과한다 (SER-001-18, SFR-018-05).
            element: <PreviewGate roles={ADMIN_ROLES} />,
            children: [
              {
                path: 'admin',
                element: <AdminLayout />,
                children: [
                  { index: true, element: <Navigate to={PATH.ADMIN_PLANTS} replace /> },
                  /*
                    등록·수정 폼이 페이지라 저마다 주소를 갖는다. 서브탭이 있는 갈래는 갈래까지
                    주소에 싣고, 그 아래 `new`·`edit` 가 폼이 된다.

                    고칠 대상은 `edit?powerPlantId=3` 처럼 queryString 으로 받는다 — 주소에
                    식별자를 박지 않는 사내 컨벤션이고, 갈래 이름과 식별자가 같은 자리를 두고
                    다투지도 않는다.
                  */
                  ...['plants', 'devices', 'field-reports', 'users'].flatMap((tab) => [
                    { path: tab, element: <AdminPage /> },
                    { path: `${tab}/:kind`, element: <AdminPage /> },
                    { path: `${tab}/:kind/new`, element: <AdminPage depth="form" /> },
                    { path: `${tab}/:kind/edit`, element: <AdminPage depth="form" /> },
                  ]),
                  // 나머지 갈래는 목록 한 장뿐이라 폼 주소가 없다.
                  { path: ':tab', element: <AdminPage /> },
                ],
              },
            ],
          },
          // 대메뉴만 눌렀을 때는 첫 소메뉴로 보낸다.
          { path: 'energy', element: <Navigate to={PATH.ENERGY_STATISTICS} replace /> },
          { path: 'ai-diagnosis', element: <Navigate to={PATH.AI_DIAGNOSIS_OVERVIEW} replace /> },
          { path: 'guide', element: <Navigate to={PATH.GUIDE_NOTICE} replace /> },
          /*
           * 사이트맵을 재편하기 전 주소들. 북마크·문서에 남아 있을 수 있어 새 자리로 넘겨 준다.
           * 화면이 합쳐진 곳은 합쳐진 자리로 보낸다.
           */
          { path: 'statistics/*', element: <Navigate to={PATH.ENERGY_STATISTICS} replace /> },
          { path: 'collection/status', element: <Navigate to={PATH.ADMIN_DATA_QUALITY} replace /> },
          { path: 'collection/*', element: <Navigate to={PATH.ENERGY_HISTORY} replace /> },
          { path: 'alerts/*', element: <Navigate to={PATH.AI_DIAGNOSIS_ALERTS} replace /> },
          { path: 'reports/monthly', element: <Navigate to={PATH.AI_DIAGNOSIS_MONTHLY} replace /> },
          { path: 'reports/board', element: <Navigate to={PATH.GUIDE_NOTICE} replace /> },
          { path: 'reports/*', element: <Navigate to={PATH.ENERGY_FIELD_REPORT} replace /> },
          { path: 'diagnosis/*', element: <Navigate to={PATH.AI_DIAGNOSIS_OVERVIEW} replace /> },
          {
            /*
              어디에도 걸리지 않은 주소.
              공개 모드에서는 고르개로 보낸다 — 홈으로 보내면 그 화면이 막혀 있어 한 번 더 튕긴다.
            */
            path: '*',
            element: <Navigate to={ONLY_PREVIEW ? PATH.PREVIEW_CHOICE : PATH.HOME} replace />,
          },
        ],
      },
    ],
  },
];
