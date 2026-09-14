import { useMemo } from 'react';
import { formatNumber } from '@/utils/format';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import type { CollectionStatus } from '@/interface/collection';
import type { OperationStatus } from '@/interface/status';
import type { School } from '@/interface/energy';
import { buildFaultGroups } from '@/pages/ControlRoom/utils/faultGroups';
import { Panel } from './Panel';
import { StatusBar } from './StatusBar';
import styles from './FaultPanel.module.scss';

/** 한 묶음에 펴 두는 이름 수 — 나머지는 「외 N곳」 으로 접는다 */
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
  /** 발전소별 수집 현황 — 데이터 미수신 묶음에 마지막 수신 시각을 적는다 */
  collection: Map<string, CollectionStatus>;
}

/**
 * 장애 발생 현황 (SFR-004-08/14).
 *
 * 지도는 「어디가」 아픈지를 답한다. 여기서는 무엇이 몇 곳이나, 왜 아픈지를 상태별로 묶어
 * 답한다. 가로로 넓은 칸이라 A 처럼 세로로 쌓지 않고 묶음마다 한 줄을 가로로 편다 —
 * 왼쪽에 상태·건수를 큰 수치로 세우고, 대표 원인과 대상 개소 이름을 오른쪽으로 흘린다.
 * 맨 위 상태 분포가 이 묶음들이 관내 전체 몇 곳 가운데 몇 곳인지를 먼저 보여 준다.
 *
 * 데이터 미수신 묶음에는 마지막 수신 시각을 함께 적는다 — 값이 언제 끊겼는지가 조치의 급함을
 * 가른다. 시각은 수집 현황의 「YYYY-MM-DD HH:mm」 에서 시·분만 떼어 쓴다.
 */
export function FaultPanel({ plants, abnormalCount, collection }: FaultPanelProps) {
  const groups = useMemo(() => buildFaultGroups(plants), [plants]);

  /** 그 묶음에서 가장 최근에 값이 들어온 시각(HH:mm) — 없으면 빈 문자열 */
  const lastReceivedOf = (rows: School[]) => rows
    .map((plant) => collection.get(plant.id)?.lastCollectedAt ?? '')
    .filter(Boolean)
    .sort()
    .at(-1)?.slice(-5) ?? '';

  return (
    <Panel title="장애 발생 현황" note={`이상 ${formatNumber(abnormalCount)}개소`}>
      <div className={styles.fault}>
        <StatusBar plants={plants} />

        {groups.length === 0 ? (
          <p className={styles.fault__empty}>조치가 필요한 설비가 없습니다.</p>
        ) : (
          <ul className={styles.fault__groups}>
            {groups.map((group) => {
              const rest = group.plants.length - CHIP_LIMIT;
              const lastReceived = group.status === 'commLost' ? lastReceivedOf(group.plants) : '';

              return (
                <li key={group.status} className={styles.group} data-tone={OPERATION_TONE[group.status]}>
                  <p className={styles.group__count}>
                    <strong className={styles.group__number}>{formatNumber(group.plants.length)}</strong>
                    <span className={styles.group__label}>
                      {GROUP_LABEL[group.status] ?? OPERATION_LABEL[group.status]}
                    </span>
                  </p>

                  <div className={styles.group__body}>
                    <p className={styles.group__reason}>
                      {group.reason}
                      {lastReceived ? (
                        <span className={styles.group__time}>· 최근 수신 {lastReceived}</span>
                      ) : null}
                    </p>
                    <ul className={styles.chips}>
                      {group.plants.slice(0, CHIP_LIMIT).map((plant) => (
                        <li key={plant.id} className={styles.chip} title={plant.name}>{plant.name}</li>
                      ))}
                      {rest > 0 ? <li className={styles.chips__more}>외 {formatNumber(rest)}곳</li> : null}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}
