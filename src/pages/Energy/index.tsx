import { Navigate, useParams } from 'react-router-dom';
import { PATH } from '@/routes/routes';
import FieldReportPage from './FieldReport';
import HistoryPage from './History';
import PlantInfoPage from './PlantInfo';
import StatisticsPage from './Statistics';

/**
 * 발전관리 — 발전통계·운전이력·현장보고서.
 *
 * 흩어져 있던 통계·수집·보고 화면을 한 대분류로 모았다. 탭 하나가 곧 폴더 하나이고,
 * 그 안에서 다시 뎁스가 갈리는 것은 각자의 `index.tsx` 가 맡는다 — 이 파일은 어느 탭을
 * 세울지만 고른다.
 */
const TABS = {
  statistics: StatisticsPage,
  history: HistoryPage,
  'field-report': FieldReportPage,
  'plant-info': PlantInfoPage,
} as const;

type TabKey = keyof typeof TABS;

interface EnergyPageProps {
  /**
   * 주소 뒤에 조회 뎁스가 붙는 화면용.
   * `/energy/statistics/:plantId` 처럼 탭 이름이 경로에 박혀 있으면 파라미터로 읽을 수 없다.
   */
  tab?: TabKey;
}

function EnergyPage({ tab: fixedTab }: EnergyPageProps) {
  const { tab } = useParams<{ tab: string }>();
  const key = fixedTab ?? tab;

  if (!key || !(key in TABS)) return <Navigate to={PATH.ENERGY_STATISTICS} replace />;

  const Tab = TABS[key as TabKey];

  return <Tab />;
}

export default EnergyPage;
