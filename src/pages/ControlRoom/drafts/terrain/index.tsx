import { TerrainBoard } from './components/TerrainBoard';
import type { ControlRoomData } from '../../useControlRoomData';

/**
 * 시안 B — 지형 (지도 중심).
 *
 * 실제 카카오 지도를 크게 세우고 그 옆에 고른 시·군의 상세를, 아래에 학교·기관·지역별 집계를
 * 둔다. 요구사항을 모두 담은 `/control`(시안 A)과 달리 **덜 담는 대신 크게 보이는** 쪽을
 * 시험하는 시안이라 판을 세 덩이(지도 / 상세 / 집계표)로 줄였다. 지도와 집계표는 큰 자리를
 * 맞바꿀 수 있다.
 *
 * 여기는 끼우기만 한다 — 배치·자리바꿈은 `TerrainBoard` 가, 값과 셈은 그 아래 컨테이너들이 쥔다.
 */
export function Terrain({ data }: { data: ControlRoomData }) {
  return <TerrainBoard data={data} />;
}

export default Terrain;
