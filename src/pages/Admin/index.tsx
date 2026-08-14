import { Navigate, useParams } from 'react-router-dom';
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

/**
 * 관리자 — 열 갈래로 나뉜 관리 화면.
 *
 * 탭 하나가 곧 폴더 하나다. 장비 관리처럼 그 아래에서 다시 종류로 갈라지는 것은 각자의
 * `index.tsx` 가 맡으므로, 이 파일은 어느 탭을 세울지만 고른다.
 */
const TABS = {
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
} as const;

type TabKey = keyof typeof TABS;

function AdminPage() {
  const { tab } = useParams<{ tab: string }>();

  if (!tab || !(tab in TABS)) return <Navigate to={PATH.ADMIN_PLANTS} replace />;

  const Tab = TABS[tab as TabKey];

  return <Tab />;
}

export default AdminPage;
