import { ControlRoomBoard } from './components/ControlRoomBoard';

/**
 * 통합관제 상황판 · 시안 A — 3단 그리드 (SFR-004).
 *
 * 벽면 모니터에 걸어 두고 지켜보는 화면이라 조작 장치를 두지 않는다. 발전소 하나로 좁혀 보는
 * 일은 발전 현황·AI진단 화면이 맡으므로, 여기서는 도 전체만 다룬다.
 */
function ControlRoomPage() {
  return <ControlRoomBoard />;
}

export default ControlRoomPage;
