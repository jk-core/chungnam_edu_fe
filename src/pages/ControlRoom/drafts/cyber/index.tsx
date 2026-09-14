import styles from './Cyber.module.scss';
import { AggRoster } from './components/AggRoster';
import { AiConsole } from './components/AiConsole';
import { FaultStack } from './components/FaultStack';
import { MapConsole } from './components/MapConsole';
import { OutputMeter } from './components/OutputMeter';
import { RegionBars } from './components/RegionBars';
import { YieldReadout } from './components/YieldReadout';
import type { ReactNode } from 'react';
import type { ControlRoomData } from '../../useControlRoomData';

/**
 * 시안 E — 사이버네틱.
 *
 * 계측 장비의 표면이다. 지도를 오른쪽 끝에 세로로 통째로 세우고 왼쪽 두 열에 나머지를 쌓는다.
 * 판 안의 생김새는 모두 이 폴더의 `components/` 가 이 시안의 결로 새로 그린다 — A 의 판을
 * 부르지 않는다. 여기(index)는 어느 판이 어느 자리에 서는지 **배치만** 조합한다.
 */
function Cell({ area, children }: { area: string; children: ReactNode }) {
  return (
    <div className={styles.cell} style={{ gridArea: area }}>
      {children}
    </div>
  );
}

export function Cyber({ data }: { data: ControlRoomData }) {
  return (
    <div className={styles.board}>
      <Cell area="out"><OutputMeter outputKw={data.totals.outputKw} capacityKw={data.totals.capacityKw} /></Cell>
      <Cell area="ai"><AiConsole plants={data.rows} /></Cell>
      <Cell area="map">
        <MapConsole plants={data.rows} abnormalCount={data.abnormalCount} />
      </Cell>

      <Cell area="yield"><YieldReadout plants={data.rows} totals={data.totals} /></Cell>
      <Cell area="region"><RegionBars /></Cell>

      <Cell area="agg"><AggRoster plants={data.rows} /></Cell>
      <Cell area="fault">
        <FaultStack
          plants={data.rows}
          abnormalCount={data.abnormalCount}
          collection={data.collection.byId}
        />
      </Cell>
    </div>
  );
}

export default Cyber;
