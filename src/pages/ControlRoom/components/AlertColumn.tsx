import type { CollectionStatus } from '@/interface/collection';
import type { School } from '@/interface/energy';
import styles from '../ControlRoom.module.scss';
import { AiPanel, FaultPanel } from './panels';

interface AlertColumnProps {
  plants: School[];
  abnormalCount: number;
  /** 발전소별 수집 상태 — 장애 목록이 마지막 수신 시각을 함께 적는다 */
  collection: Map<string, CollectionStatus>;
}

/**
 * 오른쪽 열 — 먼저 봐야 할 것.
 *
 * 위는 AI 진단이다. 검출된 고장코드 알림을 한 건씩 자세히 풀어 준다 — 무엇이, 왜,
 * 어떻게 조치해야 하는지까지 이 판 하나로 읽힌다.
 *
 * 아래는 장애 현황이다. AI 가 한 건씩 짚는 것을 여기서는 상태별 묶음으로 한눈에 센다.
 * 낱개와 묶음을 위아래로 이어 두어 같은 사실을 두 축으로 읽는다.
 */
export function AlertColumn({ plants, abnormalCount, collection }: AlertColumnProps) {
  return (
    <div className={styles.col}>
      <AiPanel plants={plants} grow />
      <FaultPanel plants={plants} abnormalCount={abnormalCount} collection={collection} />
    </div>
  );
}
