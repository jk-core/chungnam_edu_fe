import { formatNumber } from '@/utils/format';
import type { CollectionStatus } from '@/interface/collection';
import type { School } from '@/interface/energy';
import styles from '../ControlRoom.module.scss';
import { FaultGroups } from './FaultGroups';
import { Panel } from './Panel';
import { RankingStrip } from './RankingStrip';
import { RegionOutput } from './RegionOutput';

interface AlertColumnProps {
  plants: School[];
  abnormalCount: number;
  /** 발전소별 수집 상태 — 장애 목록이 마지막 수신 시각을 함께 적는다 */
  collection: Map<string, CollectionStatus>;
}

/**
 * 오른쪽 열 — 먼저 봐야 할 것.
 *
 * 순위와 시·군별 발전량을 붙여 둔다. 위가 「어느 학교가 잘 냈나」 라면 아래는 「어느 지역이
 * 얼마나 냈나」 다 — 같은 물음을 낱개와 묶음으로 이어 묻는 자리라 눈이 옮겨 가지 않아야 한다.
 *
 * 맨 아래는 장애 현황이다. 지도가 어디가 아픈지를 답했으면 여기서는 무엇이 몇 곳이나,
 * 왜 아픈지를 상태별로 묶어 답한다.
 */
export function AlertColumn({ plants, abnormalCount, collection }: AlertColumnProps) {
  return (
    <div className={styles.col}>
      <Panel title="금일 실적 순위" note="시·군별 발전시간 상위 3">
        <RankingStrip schools={plants} />
      </Panel>

      <Panel title="시·군별 발전량" note="금일 · kWh">
        <RegionOutput />
      </Panel>

      <Panel title="장애 발생 현황" note={`이상 ${formatNumber(abnormalCount)}개소`} grow>
        <FaultGroups plants={plants} collection={collection} />
      </Panel>
    </div>
  );
}
