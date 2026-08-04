import { Navigate, useParams } from 'react-router-dom';
import { PATH } from '@/routes/routes';
import { DiagnosisTab } from './components/DiagnosisTab';
import { ScheduleTab } from './components/ScheduleTab';

const TABS = {
  overview: DiagnosisTab,
  schedule: ScheduleTab,
} as const;

type TabKey = keyof typeof TABS;

function AiDiagnosisPage() {
  const { tab } = useParams<{ tab: string }>();

  if (!tab || !(tab in TABS)) return <Navigate to={PATH.AI_DIAGNOSIS_OVERVIEW} replace />;

  const Tab = TABS[tab as TabKey];

  return <Tab />;
}

export default AiDiagnosisPage;
