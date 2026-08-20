import { ReportsBoard } from './components/ReportsBoard';

/**
 * 전체 현장보고서 목록·상태 관리 (SFR-021-08).
 * 발전관리 쪽 화면은 학교 하나만 보지만, 여기서는 도 전체를 한 표에서 훑고 상태를 정리한다.
 */
function ReportsDepth() {
  return <ReportsBoard />;
}

export default ReportsDepth;
