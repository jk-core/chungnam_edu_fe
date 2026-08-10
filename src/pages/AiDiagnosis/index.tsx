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

interface AiDiagnosisPageProps {
  /** 조회 뎁스를 주소에 담는 자리는 `:tab` 이 비어 있어, 라우트가 어느 탭인지 알려 준다. */
  tab?: TabKey;
}

function AiDiagnosisPage({ tab: fixed }: AiDiagnosisPageProps) {
  const { tab } = useParams<{ tab: string }>();
  const key = fixed ?? tab;

  if (!key || !(key in TABS)) return <Navigate to={PATH.AI_DIAGNOSIS_OVERVIEW} replace />;

  const Tab = TABS[key as TabKey];

  return <Tab />;
}

export default AiDiagnosisPage;
