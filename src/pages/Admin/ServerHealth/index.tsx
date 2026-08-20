import styles from '../Admin.module.scss';
import { CpuTrendChart } from './components/CpuTrendChart';
import { DatabaseHealth } from './components/DatabaseHealth';
import { IncidentTable } from './components/IncidentTable';
import { ServerGrid } from './components/ServerGrid';
import { ServerSummary } from './components/ServerSummary';

/**
 * 서버 자원·DB 상태 모니터링 (ECR-002-20/21, ECR-003-13).
 * 사용률을 그대로 보여 주는 데 그치지 않고, 임계선을 넘은 건을 맨 위로 끌어올린다.
 */
function ServerHealthPage() {
  return (
    <div className={styles.tab}>
      <ServerSummary />
      <ServerGrid />
      <CpuTrendChart />
      <DatabaseHealth />
      <IncidentTable />
    </div>
  );
}

export default ServerHealthPage;
