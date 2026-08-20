import { formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from '../ControlRoom.module.scss';
import { AggregationPanel } from './AggregationPanel';
import { FaultMap } from './FaultMap';
import { Panel } from './Panel';

interface MapColumnProps {
  plants: School[];
  abnormalCount: number;
}

/**
 * 가운데 열 — 어디가 어떤가.
 *
 * 상황판에서 가장 먼저 답해야 할 물음이라 지도를 가운데 크게 세우고 숫자 판들을 양옆으로 둘렀다.
 * 정상까지 함께 찍어 분포가 보이게 한다 (SFR-004-01/14).
 *
 * 아래 집계표는 표 높이만 쓰고 남는 높이는 지도가 받는다 — 표는 다섯 줄이면 할 말을 다 하지만
 * 지도는 커질수록 「어디가」 를 잘 답한다.
 */
export function MapColumn({ plants, abnormalCount }: MapColumnProps) {
  return (
    <div className={styles.col}>
      <Panel
        title="관내 발전소 현황"
        note={`${formatNumber(plants.length)}개소 · 이상 ${formatNumber(abnormalCount)}개소`}
        grow
      >
        <FaultMap plants={plants} scope="all" height="100%" selectable tour />
      </Panel>

      {/* 다섯 칸짜리 표라 가운데 넓은 자리에 둔다 — 좁은 열에 밀어 넣으면 줄이 접힌다 */}
      <Panel title="발전 현황 집계">
        <AggregationPanel schools={plants} />
      </Panel>
    </div>
  );
}
