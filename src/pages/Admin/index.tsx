import { Navigate, useParams } from 'react-router-dom';
import { PATH } from '@/routes/routes';
import { AccountsTab } from './components/AccountsTab';
import { DataQualityTab } from './components/DataQualityTab';
import { DevicesTab } from './components/DevicesTab';
import { IntegrationsTab } from './components/IntegrationsTab';
import { LoginPolicyTab } from './components/LoginPolicyTab';
import { PlantsTab } from './components/PlantsTab';
import { SecurityTab } from './components/SecurityTab';
import { ServerHealthTab } from './components/ServerHealthTab';
import { UsageTab } from './components/UsageTab';
import { UsersTab } from './components/UsersTab';

const TABS = {
  plants: PlantsTab,
  devices: DevicesTab,
  users: UsersTab,
  accounts: AccountsTab,
  integrations: IntegrationsTab,
  'login-policy': LoginPolicyTab,
  usage: UsageTab,
  'data-quality': DataQualityTab,
  security: SecurityTab,
  'server-health': ServerHealthTab,
} as const;

type TabKey = keyof typeof TABS;

function AdminPage() {
  const { tab } = useParams<{ tab: string }>();

  if (!tab || !(tab in TABS)) return <Navigate to={PATH.ADMIN_PLANTS} replace />;

  const Tab = TABS[tab as TabKey];

  return <Tab />;
}

export default AdminPage;
