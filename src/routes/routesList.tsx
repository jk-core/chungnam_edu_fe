import { Navigate } from 'react-router-dom';
import { lazy } from 'react';
import AuthLayout from '@/layouts/AuthLayout';
import RootLayout from '@/layouts/RootLayout';
import SubPageLayout from '@/layouts/SubPageLayout';
import HomePage from '@/pages/Home';
import { RequireAuth } from './guards/RequireAuth';
import { PATH } from './routes';
import type { RouteObject } from 'react-router-dom';

// 차트 라이브러리를 함께 들고 오는 화면들은 첫 화면 번들에서 떼어 낸다.
const StatisticsPage = lazy(() => import('@/pages/Statistics'));
const CollectionPage = lazy(() => import('@/pages/Collection'));
const AiDiagnosisPage = lazy(() => import('@/pages/AiDiagnosis'));
const AlertsPage = lazy(() => import('@/pages/Alerts'));
const ReportsPage = lazy(() => import('@/pages/Reports'));
const MyPage = lazy(() => import('@/pages/MyPage'));
const LoginPage = lazy(() => import('@/pages/Login'));
const KioskPage = lazy(() => import('@/pages/Kiosk'));
const SolarEduPage = lazy(() => import('@/pages/SolarEdu'));
const ControlRoomPage = lazy(() => import('@/pages/ControlRoom'));
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const AdminPage = lazy(() => import('@/pages/Admin'));

export const routes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [{ path: PATH.LOGIN, element: <LoginPage /> }],
  },
  // 교육용 대시보드는 모니터에 걸어 두고 조작 없이 돌리는 화면이라 로그인을 요구하지 않는다 (SFR-005-08).
  // 세션이 만료됐다고 복도 모니터가 로그인 화면으로 튕기면 안 된다.
  { path: PATH.KIOSK, element: <KioskPage /> },
  { path: `${PATH.KIOSK}/:orgId`, element: <KioskPage /> },
  { path: PATH.SOLAR_EDU, element: <SolarEduPage /> },
  { path: `${PATH.SOLAR_EDU}/:orgId`, element: <SolarEduPage /> },
  {
    // 로그인하지 않으면 아래 화면 전부 막힌다.
    element: <RequireAuth />,
    children: [
      // 통합관제 상황판은 운영자용이라 로그인은 받되, 헤더·LNB 없이 화면을 다 쓴다.
      { path: PATH.CONTROL, element: <ControlRoomPage /> },
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
              { path: 'statistics/:tab', element: <StatisticsPage /> },
              { path: 'collection/:tab', element: <CollectionPage /> },
              { path: 'ai-diagnosis/:tab', element: <AiDiagnosisPage /> },
              { path: 'alerts/:tab', element: <AlertsPage /> },
              { path: 'reports/:tab', element: <ReportsPage /> },
            ],
          },
          {
            // 관리자 콘솔은 내부망 전용이고 관리자 역할만 통과한다 (SER-001-18, SFR-018-05).
            element: <RequireAuth roles={['admin']} />,
            children: [
              {
                path: 'admin',
                element: <AdminLayout />,
                children: [
                  { index: true, element: <Navigate to={PATH.ADMIN_PLANTS} replace /> },
                  { path: ':tab', element: <AdminPage /> },
                ],
              },
            ],
          },
          // 대메뉴만 눌렀을 때는 첫 소메뉴로 보낸다.
          { path: 'statistics', element: <Navigate to={PATH.STATISTICS_OVERVIEW} replace /> },
          { path: 'collection', element: <Navigate to={PATH.COLLECTION_TREND} replace /> },
          { path: 'ai-diagnosis', element: <Navigate to={PATH.AI_DIAGNOSIS_SUMMARY} replace /> },
          { path: 'alerts', element: <Navigate to={PATH.ALERTS_LIST} replace /> },
          { path: 'reports', element: <Navigate to={PATH.REPORTS_MONTHLY} replace /> },
          // 예전에 쓰던 주소로 들어와도 이어지게 둔다.
          { path: 'diagnosis/*', element: <Navigate to={PATH.AI_DIAGNOSIS_SUMMARY} replace /> },
          { path: '*', element: <Navigate to={PATH.HOME} replace /> },
        ],
      },
    ],
  },
];
