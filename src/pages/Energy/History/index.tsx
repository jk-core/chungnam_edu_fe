import { HistoryBoard } from './components/HistoryBoard';

/**
 * 인버터별 통신주기 운전이력 (SFR-009, SFR-010).
 * 인버터를 골라 전압·전류·전력 기록을 그래프나 표로 보고 엑셀로 내려받는다.
 */
function HistoryPage() {
  return <HistoryBoard />;
}

export default HistoryPage;
