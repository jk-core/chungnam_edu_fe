import styles from '../Admin.module.scss';
import { LoginTrendChart } from './components/LoginTrendChart';
import { MenuUsageChart } from './components/MenuUsageChart';
import { MenuUsageTable } from './components/MenuUsageTable';
import { UsageSummary } from './components/UsageSummary';

/** 시스템 활용 통계 (SFR-028) — 최근 30일 기준. */
function UsagePage() {
  return (
    <div className={styles.tab}>
      <UsageSummary />

      <div className={styles.grid2}>
        <MenuUsageChart />
        <LoginTrendChart />
      </div>

      <MenuUsageTable />
    </div>
  );
}

export default UsagePage;
