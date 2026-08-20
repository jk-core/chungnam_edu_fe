import { DataWallBoard } from './components/DataWallBoard';

/**
 * 통합관제 상황판 · 시안 D — 데이터 월 (SFR-004).
 *
 * 앞의 시안들은 무엇을 크게 볼지 골랐다 — A 는 지도, B 도 지도, C 는 장애. 고른다는 것은
 * 나머지를 작게 두거나 접는다는 뜻이고, 지켜보는 사람이 그 판단에 동의하지 않으면 화면이 답답해진다.
 *
 * 이 시안은 고르지 않는다. 아홉 개 판을 **같은 크기로** 깔아 전부를 한 화면에 세운다.
 * 눈이 어디로 가든 막히지 않고, 무엇이 중요한지는 화면이 아니라 보는 사람이 정한다.
 * 대신 판 하나하나는 작다 — 각 판이 답하는 물음을 하나로 좁혀야 이 구성이 성립한다.
 */
function DataWallPage() {
  return <DataWallBoard />;
}

export default DataWallPage;
