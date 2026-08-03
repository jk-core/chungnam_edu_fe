import { Navigate, useParams } from 'react-router-dom';
import { PATH } from '@/routes/routes';
import { HistoryTab } from './components/HistoryTab';
import { RawTab } from './components/RawTab';
import { StatusTab } from './components/StatusTab';
import { TrendTab } from './components/TrendTab';

const TABS = {
  trend: TrendTab,
  raw: RawTab,
  status: StatusTab,
  history: HistoryTab,
} as const;

type TabKey = keyof typeof TABS;

function CollectionPage() {
  const { tab } = useParams<{ tab: string }>();

  if (!tab || !(tab in TABS)) return <Navigate to={PATH.COLLECTION_TREND} replace />;

  const Tab = TABS[tab as TabKey];

  return <Tab />;
}

export default CollectionPage;
