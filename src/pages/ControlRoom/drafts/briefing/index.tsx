import { AggregationPanel } from './components/AggregationPanel';
import { AiPanel } from './components/AiPanel';
import { FaultPanel } from './components/FaultPanel';
import { MapPanel } from './components/MapPanel';
import { OutputPanel } from './components/OutputPanel';
import { RegionPanel } from './components/RegionPanel';
import { YieldPanel } from './components/YieldPanel';
import styles from './Briefing.module.scss';
import type { ReactNode } from 'react';
import type { ControlRoomData } from '../../useControlRoomData';

/**
 * 시안 B — 브리핑 보드.
 *
 * 회의실 앞에 걸어 두고 여럿이 함께 보는 판이다. 가로로 읽는 배치라 눈이 좌우로 훑으며 한 단씩
 * 내려온다. 지도가 두 칸을 가로질러 가장 넓은 자리를 받고, AI 진단은 오른쪽에서 두 단을 꿰어
 * 글이 끝까지 보일 높이를 얻는다.
 *
 * 이 파일은 배치만 짠다 — 어느 판이 어디에 서는가. 판 안의 상태·데이터·그리기는 각 판
 * 컴포넌트가 제 폴더(`./components`) 안에서 쥔다. 판 안의 생김새는 A 를 불러 쓰지 않고 이 칸
 * 크기에 맞춰 새로 짠 것이다 (고객 지시 — 「각 시안 박스 내부도 A 재사용 말고 새 버전으로」).
 */
function Cell({ area, children }: { area: string; children: ReactNode }) {
  return (
    <div className={styles.cell} style={{ gridArea: area }}>
      {children}
    </div>
  );
}

export function Briefing({ data }: { data: ControlRoomData }) {
  return (
    <div className={styles.board}>
      <Cell area="out"><OutputPanel totals={data.totals} /></Cell>
      <Cell area="yield"><YieldPanel plants={data.rows} totals={data.totals} /></Cell>
      <Cell area="ai"><AiPanel plants={data.rows} /></Cell>

      <Cell area="map">
        <MapPanel plants={data.rows} abnormalCount={data.abnormalCount} />
      </Cell>

      <Cell area="agg"><AggregationPanel plants={data.rows} /></Cell>
      <Cell area="fault">
        <FaultPanel plants={data.rows} abnormalCount={data.abnormalCount} collection={data.collection.byId} />
      </Cell>
      <Cell area="region"><RegionPanel /></Cell>
    </div>
  );
}

export default Briefing;
