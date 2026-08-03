import { Navigate, useParams } from 'react-router-dom';
import { PATH } from '@/routes/routes';
import { BoardTab } from './components/BoardTab';
import { FieldTab } from './components/FieldTab';
import { MonthlyTab } from './components/MonthlyTab';

const TABS = {
  monthly: MonthlyTab,
  field: FieldTab,
  board: BoardTab,
} as const;

type TabKey = keyof typeof TABS;

function ReportsPage() {
  const { tab } = useParams<{ tab: string }>();

  if (!tab || !(tab in TABS)) return <Navigate to={PATH.REPORTS_MONTHLY} replace />;

  const Tab = TABS[tab as TabKey];

  return <Tab />;
}

export default ReportsPage;
