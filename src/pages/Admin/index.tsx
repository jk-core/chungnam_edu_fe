import { Navigate, useLocation, useParams } from 'react-router-dom';
import { PATH } from '@/routes/routes';
import AccountsPage from './Accounts';
import DataQualityPage from './DataQuality';
import DevicesPage from './Devices';
import FieldReportsPage from './FieldReports';
import IntegrationsPage from './Integrations';
import LoginPolicyPage from './LoginPolicy';
import PlantsPage from './Plants';
import ServerHealthPage from './ServerHealth';
import UsagePage from './Usage';
import UsersPage from './Users';
import type { ComponentType } from 'react';
import type { AdminDepth } from './_shared/adminPath';

/**
 * 관리자 — 열 갈래로 나뉜 관리 화면.
 *
 * 탭 하나가 곧 폴더 하나다. 장비 관리처럼 그 아래에서 다시 종류로 갈라지는 것과, 목록에서
 * 폼으로 들어가는 것은 각자의 `index.tsx` 가 맡으므로, 이 파일은 어느 탭을 세울지만 고른다.
 */
const TABS: Record<string, ComponentType<{ depth: AdminDepth }>> = {
  plants: PlantsPage,
  devices: DevicesPage,
  'field-reports': FieldReportsPage,
  users: UsersPage,
  accounts: AccountsPage,
  integrations: IntegrationsPage,
  'login-policy': LoginPolicyPage,
  usage: UsagePage,
  'data-quality': DataQualityPage,
  'server-health': ServerHealthPage,
};

function AdminPage({ depth = 'list' }: { depth?: AdminDepth }) {
  const { tab } = useParams<{ tab: string }>();
  const { pathname } = useLocation();
  // 서브탭이 있는 갈래는 주소에 탭 이름이 그대로 박혀 있어 `tab` 파라미터가 잡히지 않는다.
  const name = tab ?? pathname.split('/')[2];

  if (!name || !(name in TABS)) return <Navigate to={PATH.ADMIN_PLANTS} replace />;

  const Tab = TABS[name];

  return <Tab depth={depth} />;
}

export default AdminPage;
