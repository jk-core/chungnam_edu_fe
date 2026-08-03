import { Navigate, useParams } from 'react-router-dom';
import { PATH } from '@/routes/routes';
import { EcoTab } from './components/EcoTab';
import { OverviewTab } from './components/OverviewTab';
import { PeriodTab } from './components/PeriodTab';
import { SchoolTab } from './components/SchoolTab';

const TABS = {
  overview: OverviewTab,
  period: PeriodTab,
  school: SchoolTab,
  eco: EcoTab,
} as const;

type TabKey = keyof typeof TABS;

function StatisticsPage() {
  const { tab } = useParams<{ tab: string }>();

  if (!tab || !(tab in TABS)) return <Navigate to={PATH.STATISTICS_OVERVIEW} replace />;

  const Tab = TABS[tab as TabKey];

  return <Tab />;
}

export default StatisticsPage;
