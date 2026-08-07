import { KpiStrip } from './components/KpiStrip';
import { MonitoringBoard } from './components/MonitoringBoard';
import { NationalBoard } from './components/NationalBoard';
import { NoticePopup } from './components/NoticePopup';
import { SunArcHero } from './components/SunArcHero';
import styles from './Home.module.scss';

/**
 * 홈 — 금일 발전 현황 (SFR-006).
 * 회의 결정대로 지도를 주역으로 두되, 요구사항이 이 화면에 묶어 둔 전국 평균 발전시간
 * 분포 지도(SFR-006-03/04)는 여기 남긴다.
 */
function HomePage() {
  return (
    <div className={styles.home}>
      <SunArcHero />
      <KpiStrip />
      {/* 지도를 주역으로 올린다 — 홈에서 학교를 찾아 들어가는 길이 가장 잦다. */}
      <MonitoringBoard />
      <NationalBoard />
      <NoticePopup />
    </div>
  );
}

export default HomePage;
