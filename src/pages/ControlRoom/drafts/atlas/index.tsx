import { AggregationPanel } from './components/AggregationPanel';
import { AiPanel } from './components/AiPanel';
import { FaultPanel } from './components/FaultPanel';
import { MapPanel } from './components/MapPanel';
import { OutputPanel } from './components/OutputPanel';
import { RegionHoursPanel } from './components/RegionHoursPanel';
import { YieldPanel } from './components/YieldPanel';
import styles from './Atlas.module.scss';
import type { ReactNode } from 'react';
import type { ControlRoomData } from '../../useControlRoomData';

/**
 * 시안 C — 아틀라스.
 *
 * 책상에 펼쳐 놓은 지도책이다. 「어디가」 를 왼쪽 한 면이 답하고 오른쪽 면에서 수치를 훑는다.
 * AI 진단은 두 칸을 함께 써서 지도와 글을 좌우로 펴고, 집계표는 맨 아랫단 전체 폭을 쓴다.
 *
 * 판 일곱은 A 와 담는 것은 같되 그리기를 이 시안(선·행)의 결로 새로 짠 것이다 — 자리만 여기서
 * 조합하고 상태·데이터 로직은 각 판이 쥔다.
 */
function Cell({ area, children }: { area: string; children: ReactNode }) {
  return (
    <div className={styles.cell} style={{ gridArea: area }}>
      {children}
    </div>
  );
}

export function Atlas({ data }: { data: ControlRoomData }) {
  return (
    <div className={styles.board}>
      <Cell area="map">
        <MapPanel plants={data.rows} abnormalCount={data.abnormalCount} />
      </Cell>

      <Cell area="out"><OutputPanel totals={data.totals} /></Cell>
      <Cell area="yield"><YieldPanel totals={data.totals} plants={data.rows} /></Cell>

      <Cell area="ai"><AiPanel plants={data.rows} /></Cell>

      <Cell area="fault">
        <FaultPanel plants={data.rows} abnormalCount={data.abnormalCount} collection={data.collection.byId} />
      </Cell>
      <Cell area="region"><RegionHoursPanel /></Cell>

      <Cell area="agg"><AggregationPanel plants={data.rows} /></Cell>
    </div>
  );
}

export default Atlas;
