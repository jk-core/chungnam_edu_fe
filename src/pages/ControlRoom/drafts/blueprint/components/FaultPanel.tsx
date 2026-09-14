import { useMemo } from 'react';
import { formatNumber } from '@/utils/format';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import type { CollectionStatus } from '@/interface/collection';
import type { OperationStatus } from '@/interface/status';
import type { School } from '@/interface/energy';
import { buildFaultGroups } from '@/pages/ControlRoom/utils/faultGroups';
import { Panel } from './Panel';
import { StatusMeter } from './StatusMeter';
import { TONE_VAR } from './status';
import styles from './FaultPanel.module.scss';
import type { CSSProperties } from 'react';

/**
 * 묶음마다 펴 두는 이름 수.
 * 한 줄에 들어가는 만큼만 편다 — 이름은 몇 개 보이든 「어디가」 를 다 답하지 못하고, 나머지는
 * 「외 N개소」 로 접는다. 아낀 높이는 위 판(AI 진단)이 가져간다.
 */
const CHIP_LIMIT = 4;

/*
  묶음 제목만 다르게 부른다 (2026-08-25 사업팀 회의).
  값이 끊긴 것을 「통신단절」 이라 하면 회선 고장으로 읽혀, 여기서는 일어난 일 그대로 적는다.
*/
const GROUP_LABEL: Partial<Record<OperationStatus, string>> = {
  commLost: '데이터 미수신',
};

interface FaultPanelProps {
  plants: School[];
  abnormalCount: number;
  collection: Map<string, CollectionStatus>;
}

/** 이 화면에 깔린 값 가운데 가장 늦게 들어온 수신 시각 — 벽시계와 견줘 밀림을 읽는다 */
function latestCollectedAt(collection: Map<string, CollectionStatus>): string | null {
  let best = '';

  collection.forEach((row) => {
    if (row.lastCollectedAt > best) best = row.lastCollectedAt;
  });

  return best || null;
}

/**
 * 장애 발생 현황 (SFR-004-08/14) — 청사진 판.
 *
 * 지도가 「어디가」 를 답한다면 여기서는 **무엇이 몇 곳이나, 왜** 를 상태별로 묶어 답한다.
 * 맨 위 상태 분포가 관내 전체 몇 곳 중 몇 곳인지 먼저 보이고, 그 아래 묶음마다 큰 수·원인·이름을
 * 도면의 표제처럼 세운다. 이름은 급한 것부터 몇 개만 펴고 나머지는 「외 N개소」 로 접는다.
 */
export function FaultPanel({ plants, abnormalCount, collection }: FaultPanelProps) {
  const groups = useMemo(() => buildFaultGroups(plants), [plants]);
  const collectedAt = latestCollectedAt(collection);

  return (
    <Panel title="장애 발생 현황" note={`이상 ${formatNumber(abnormalCount)}개소`} grow>
      <div className={styles.fault}>
        <StatusMeter plants={plants} />

        {groups.length === 0 ? (
          <p className={styles.fault__empty}>조치가 필요한 설비가 없습니다.</p>
        ) : (
          <ul className={styles.groups}>
            {groups.map((group) => {
              const rest = group.plants.length - CHIP_LIMIT;

              return (
                <li
                  key={group.status}
                  className={styles.group}
                  style={{ '--seg': TONE_VAR[OPERATION_TONE[group.status]] } as CSSProperties}
                >
                  <div className={styles.group__head}>
                    <strong className={styles.group__count}>{formatNumber(group.plants.length)}</strong>
                    <span className={styles.group__label}>{GROUP_LABEL[group.status] ?? OPERATION_LABEL[group.status]}</span>
                    <span className={styles.group__reason}>{group.reason}</span>
                  </div>

                  <ul className={styles.chips}>
                    {group.plants.slice(0, CHIP_LIMIT).map((plant) => (
                      <li key={plant.id} className={styles.chip} title={plant.name}>{plant.name}</li>
                    ))}
                    {rest > 0 ? <li className={styles.chips__more}>외 {formatNumber(rest)}개소</li> : null}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}

        {collectedAt ? (
          <p className={styles.fault__foot}>
            <span className={styles.fault__footLabel}>최근 수신</span>
            <span className={styles.fault__footValue}>{collectedAt}</span>
          </p>
        ) : null}
      </div>
    </Panel>
  );
}
