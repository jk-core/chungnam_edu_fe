import { Navigate, useParams } from 'react-router-dom';
import { PATH } from '@/routes/routes';
import { EquipmentTab } from './components/EquipmentTab';
import { FaultsTab } from './components/FaultsTab';
import { ScheduleTab } from './components/ScheduleTab';
import { SummaryTab } from './components/SummaryTab';
import { TimelineTab } from './components/TimelineTab';

const TABS = {
  summary: SummaryTab,
  equipment: EquipmentTab,
  faults: FaultsTab,
  timeline: TimelineTab,
  schedule: ScheduleTab,
} as const;

type TabKey = keyof typeof TABS;

function AiDiagnosisPage() {
  const { tab } = useParams<{ tab: string }>();

  if (!tab || !(tab in TABS)) return <Navigate to={PATH.AI_DIAGNOSIS_SUMMARY} replace />;

  const Tab = TABS[tab as TabKey];

  return <Tab />;
}

export default AiDiagnosisPage;
