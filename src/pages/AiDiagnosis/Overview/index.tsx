import { OverviewBoard } from './components/OverviewBoard';

/**
 * AI 진단 한 화면 (SFR-011 · SFR-013).
 *
 * 상단 발전성능비(PR)·이용률(CF)은 걷어냈다 — 요구사항에 없는 지표다.
 */
function OverviewPage() {
  return <OverviewBoard />;
}

export default OverviewPage;
