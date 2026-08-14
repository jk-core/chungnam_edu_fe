import { Navigate, useParams } from 'react-router-dom';
import { PATH } from '@/routes/routes';
import AlertsPage from './Alerts';
import MonthlyPage from './Monthly';
import OverviewPage from './Overview';

/**
 * AI진단 — 진단 개요·월간보고서·알림.
 *
 * 탭 하나가 곧 폴더 하나다. 그 안에서 다시 갈라지는 것(알림의 네 갈래)은 각자의 `index.tsx`
 * 가 맡으므로, 이 파일은 어느 탭을 세울지만 고른다.
 */
const TABS = {
  overview: OverviewPage,
  monthly: MonthlyPage,
  alerts: AlertsPage,
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
