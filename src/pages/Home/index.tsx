import { KpiStrip } from './components/KpiStrip';
import { MonitoringBoard } from './components/MonitoringBoard';
import { NationalBoard } from './components/NationalBoard';
import { NoticePopup } from './components/NoticePopup';
import { QuickLinks } from './components/QuickLinks';
import { RegionBoard } from './components/RegionBoard';
import { SunArcHero } from './components/SunArcHero';
import styles from './Home.module.scss';

function HomePage() {
  return (
    <div className={styles.home}>
      <SunArcHero />
      <KpiStrip />
      <RegionBoard />
      <MonitoringBoard />
      <NationalBoard />
      <QuickLinks />
      <NoticePopup />
    </div>
  );
}

export default HomePage;
