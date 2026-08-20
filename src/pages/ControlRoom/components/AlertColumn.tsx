import { formatNumber } from '@/utils/format';
import type { CollectionStatus } from '@/interface/collection';
import type { School } from '@/interface/energy';
import styles from '../ControlRoom.module.scss';
import { AiScanBoard } from './AiScanBoard';
import { FaultGroups } from './FaultGroups';
import { Panel } from './Panel';
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
 * 맨 위는 AI 진단이다. 지금 관내를 훑고 있다는 사실과 방금 잡아낸 소견을 보여 준다.
 * 가운데는 시·군별 발전량 — 어느 지역이 얼마나 냈는지를 묶음으로 본다.
 *
 * 맨 아래는 장애 현황이다. 지도가 어디가 아픈지를 답했으면 여기서는 무엇이 몇 곳이나,
 * 왜 아픈지를 상태별로 묶어 답한다. 위에서 AI 가 짚은 것이 아래 묶음으로 쌓이는 셈이다.
 */
export function AlertColumn({ plants, abnormalCount, collection }: AlertColumnProps) {
  return (
    <div className={styles.col}>
      <Panel title="AI 진단" note={`관내 ${formatNumber(plants.length)}개소`}>
        <AiScanBoard plantCount={plants.length} />
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
