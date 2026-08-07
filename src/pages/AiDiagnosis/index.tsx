import { Navigate, useParams } from 'react-router-dom';
import { PATH } from '@/routes/routes';
import { MonthlyTab } from '@/pages/Reports/components/MonthlyTab';
import { AlertsTab } from './components/AlertsTab';
import { DiagnosisTab } from './components/DiagnosisTab';

const TABS = {
  overview: DiagnosisTab,
  monthly: MonthlyTab,
  alerts: AlertsTab,
} as const;

type TabKey = keyof typeof TABS;

function AiDiagnosisPage() {
  const { tab } = useParams<{ tab: string }>();

  if (!tab || !(tab in TABS)) return <Navigate to={PATH.AI_DIAGNOSIS_OVERVIEW} replace />;

  const Tab = TABS[tab as TabKey];

  return <Tab />;
}

export default AiDiagnosisPage;
