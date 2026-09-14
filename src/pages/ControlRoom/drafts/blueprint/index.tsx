import { AggregationPanel } from './components/AggregationPanel';
import { AiPanel } from './components/AiPanel';
import { FaultPanel } from './components/FaultPanel';
import { OutputPanel } from './components/OutputPanel';
import { PlantMapPanel } from './components/PlantMapPanel';
import { RegionHoursPanel } from './components/RegionHoursPanel';
import { YieldPanel } from './components/YieldPanel';
import styles from './Blueprint.module.scss';
import type { ReactNode } from 'react';
import type { ControlRoomData } from '../../useControlRoomData';

/**
 * 시안 D — 청사진.
 *
 * 설계 도면 한 장이다. 넓은 자리를 넉 장으로 크게 나누고 계측값은 오른쪽 좁은 레일에 몰아
 * 세운다. 판이 반투명이라 바탕의 도면 격자가 판을 가로질러 이어진다.
 *
 * 이 파일은 배치 조합만 한다 — 판마다의 상태·데이터·셈은 각 판이 쥐고, 여기서는 어느 판이
 * 어느 자리에 서는지만 정한다. 판 안의 생김새는 전부 `components/` 안에서 새로 그렸다.
 */
function Cell({ area, children }: { area: string; children: ReactNode }) {
  return (
    <div className={styles.cell} style={{ gridArea: area }}>
      {children}
    </div>
  );
}

export function Blueprint({ data }: { data: ControlRoomData }) {
  return (
    <div className={styles.board}>
      <Cell area="map">
        <PlantMapPanel plants={data.rows} abnormalCount={data.abnormalCount} />
      </Cell>
      <Cell area="ai"><AiPanel plants={data.rows} /></Cell>

      {/* 오른쪽 레일 — 총량에서 시·군까지 한 줄기로 좁혀 읽는다 */}
      <Cell area="rail">
        <OutputPanel totals={data.totals} />
        <YieldPanel plants={data.rows} totals={data.totals} />
        <RegionHoursPanel />
      </Cell>

      <Cell area="agg"><AggregationPanel plants={data.rows} /></Cell>
      <Cell area="fault">
        <FaultPanel
          plants={data.rows}
          abnormalCount={data.abnormalCount}
          collection={data.collection.byId}
        />
      </Cell>
    </div>
  );
}

export default Blueprint;
