import { Navigate, useParams } from 'react-router-dom';
import { PATH } from '@/routes/routes';
import { ListTab } from './components/ListTab';
import { PendingTab } from './components/PendingTab';
import { SettingsTab } from './components/SettingsTab';
import { TimelineTab } from './components/TimelineTab';

const TABS = {
  list: ListTab,
  pending: PendingTab,
  timeline: TimelineTab,
  settings: SettingsTab,
} as const;

type TabKey = keyof typeof TABS;

function AlertsPage() {
  const { tab } = useParams<{ tab: string }>();

  if (!tab || !(tab in TABS)) return <Navigate to={PATH.ALERTS_LIST} replace />;

  const Tab = TABS[tab as TabKey];

  return <Tab />;
}

export default AlertsPage;
