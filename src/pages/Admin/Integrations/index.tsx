import styles from '../Admin.module.scss';
import { IntegrationLogTable } from './components/IntegrationLogTable';
import { IntegrationSummary } from './components/IntegrationSummary';
import { IntegrationTrendChart } from './components/IntegrationTrendChart';

/** 교육부 연계이력 관리 (SFR-027) */
function IntegrationsPage() {
  return (
    <div className={styles.tab}>
      <IntegrationSummary />
      <IntegrationTrendChart />
      <IntegrationLogTable />
    </div>
  );
}

export default IntegrationsPage;
