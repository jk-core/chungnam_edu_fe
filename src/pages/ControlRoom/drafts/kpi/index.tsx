import { AggregationCard, YieldPanel } from '@/pages/ControlRoom/components/panels';
import { MapBoard } from './components/MapBoard';
import styles from './Kpi.module.scss';
import type { ReactNode } from 'react';
import type { ControlRoomData } from '../../useControlRoomData';

/**
 * 시안 B — 지표 전면.
 *
 * `feat/권영서-상황판시안` 의 v1 을 옮겨 왔다 (2026-09-16 지시). 「글자가 작다」 는 말에서 나온
 * 갈래로, 값과 판은 `/control` 것을 그대로 쓰되 겹치는 판을 덜어 내고 남는 판을 키워 멀리서도
 * 읽히게 한다.
 *
 * 왼쪽은 관내 발전소 현황 한 판이다. 시·군 도형 · 시·군 상세 칸 · 충남 전체 박스가 그 안에 함께
 * 들어 있어 「어느 시·군이」 와 「도 전체로는」 이 한 판에서 끝난다. 오른쪽은 쌓인 숫자다 —
 * 위는 오늘·이달·올해·누적으로 시간을 따라 쌓인 양, 아래는 같은 오늘을 시·군으로 갈라 세운
 * 순위라 세로축이 시간과 지역으로 갈린다.
 *
 * 실적 표가 단에 남는 높이를 받는다. 집계표는 여섯 줄로 못 박혀 줄지도 늘지도 못하므로, 남는
 * 몫은 늘어날 수 있는 쪽으로 보낸다.
 */

/** 세로로 쌓는 단 하나. `grow` 를 받은 판이 남는 높이를 가져간다. */
function Rail({ children }: { children: ReactNode }) {
  return <div className={styles.rail}>{children}</div>;
}

export function Kpi({ data }: { data: ControlRoomData }) {
  return (
    <div className={`${styles.stage} ${styles.kpiStage}`}>
      <MapBoard
        plants={data.rows}
        totals={data.totals}
        abnormalCount={data.abnormalCount}
        collection={data.collection.byId}
        alerts={data.openAlerts}
      />

      <Rail>
        <YieldPanel plants={data.rows} totals={data.totals} grow />
        <AggregationCard plants={data.rows} />
      </Rail>
    </div>
  );
}

export default Kpi;
