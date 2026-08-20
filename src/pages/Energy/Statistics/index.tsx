import { StatisticsBoard } from './components/StatisticsBoard';

/**
 * 발전통계 (SFR-007, SFR-008).
 *
 * 뎁스를 여러 단 파고드는 화면이라, 뎁스마다 다른 부분만 하위 폴더로 떼어 두고 본문에서 결합한다.
 */
function StatisticsPage() {
  return <StatisticsBoard />;
}

export default StatisticsPage;
