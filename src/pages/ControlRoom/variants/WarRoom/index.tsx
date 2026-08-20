import { WarRoomBoard } from './components/WarRoomBoard';

/**
 * 통합관제 상황판 · 시안 B — 다크 워룸 (SFR-004).
 *
 * 상황판에서 가장 먼저 답해야 할 물음이 "지금 어디가 어떤가" 라면, 지도를 한 칸에 가두는 것부터가
 * 손해다. 그래서 지도를 화면 전체로 깔고 숫자는 그 위에 뜨는 유리판으로 얹었다. 지도가 늘 배경에
 * 살아 있으니 어느 지표를 보다가도 눈이 위치로 돌아온다.
 *
 * 바탕을 어둡게 두는 것은 멋이 아니라 신호 대 잡음의 문제다. 관제실은 어둡고 화면은 크다 —
 * 흰 바탕이 화면의 9할을 차지하면 정작 켜져야 할 경고색이 묻힌다. 어두운 바탕에서는 색이 곧 신호다.
 */
function WarRoomPage() {
  return <WarRoomBoard />;
}

export default WarRoomPage;
