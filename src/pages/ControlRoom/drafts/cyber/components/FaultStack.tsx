import { useMemo } from 'react';
import { formatNumber } from '@/utils/format';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import type { CollectionStatus } from '@/interface/collection';
import type { OperationStatus } from '@/interface/status';
import type { School } from '@/interface/energy';
import { buildFaultGroups } from '@/pages/ControlRoom/utils/faultGroups';
import { CyberPanel } from './CyberPanel';
import { CyberStatusMix } from './CyberStatusMix';
import styles from './FaultStack.module.scss';

/**
 * 묶음마다 펴 두는 이름 수.
 * 한 줄에 들어가는 만큼만 편다 — 이름은 몇 개 보이든 「어디가」 를 다 답하지 못하고, 그 답은
 * 급한 곳부터 몇 개다. 나머지는 수로 접는다.
 */
const CHIP_LIMIT = 3;

/*
  묶음 제목만 다르게 부른다 (2026-08-25 사업팀 회의).
  값이 끊긴 것을 「통신단절」이라 하면 회선 고장으로 읽혀, 여기서는 일어난 일 그대로 적는다.
*/
const GROUP_LABEL: Partial<Record<OperationStatus, string>> = {
  commLost: '데이터 미수신',
};

interface FaultStackProps {
  /** 전체 발전소 — 이 중 이상 상태만 묶고, 상태 분포는 정상까지 함께 센다 */
  plants: School[];
  abnormalCount: number;
  /** 발전소별 수집 현황 — 가장 최근 수신 시각을 판 바닥에 적는다 */
  collection: Map<string, CollectionStatus>;
}

/**
 * 장애 발생 현황 (SFR-004-08/14).
 *
 * 담는 것은 시안 A 의 `FaultGroups` 와 같다 — 맨 위 상태 분포(막대와 건수), 그 아래 상태별
 * 묶음(막대·건수·대표 원인·대상 개소 이름), 그리고 가장 최근 수신 시각.
 *
 * A 는 「+N 더보기」 가 모달을 열어 나머지 이름과 마지막 수신 시각을 마저 보였지만, 벽에 걸어
 * 두고 훑어보는 이 화면에서는 눌러 여는 창이 뜻이 옅다 — 급한 곳부터 몇 이름만 펴고 나머지는
 * 수로 접은 뒤, 관내에서 가장 최근에 값이 들어온 시각을 판 바닥 한 줄로 대신 세운다.
 *
 * 각 묶음은 상태 색으로 왼쪽에 채널 막대를 세운다 — 색만으로 갈리지 않게 라벨·건수를 함께 적는다.
 */
export function FaultStack({ plants, abnormalCount, collection }: FaultStackProps) {
  const groups = useMemo(() => buildFaultGroups(plants), [plants]);

  // 가장 최근에 값이 들어온 시각 — 수집 현황 중 가장 늦은 것을 고른다
  const latest = useMemo(() => {
    let best = '';

    collection.forEach((row) => {
      if (row.lastCollectedAt > best) best = row.lastCollectedAt;
    });

    return best;
  }, [collection]);

  return (
    <CyberPanel title="장애 발생 현황" note={`이상 ${formatNumber(abnormalCount)}개소`}>
      <div className={styles.stack}>
        <CyberStatusMix plants={plants} />

        {groups.length === 0 ? (
          <p className={styles.stack__empty}>조치가 필요한 설비가 없습니다.</p>
        ) : (
          <ul className={styles.stack__groups}>
            {groups.map((group) => {
              const rest = group.plants.length - CHIP_LIMIT;

              return (
                <li key={group.status} className={styles.group} data-tone={OPERATION_TONE[group.status]}>
                  <p className={styles.group__head}>
                    <span className={styles.group__label}>
                      {GROUP_LABEL[group.status] ?? OPERATION_LABEL[group.status]}
                    </span>
                    <strong className={styles.group__count}>{formatNumber(group.plants.length)}</strong>
                    <span className={styles.group__reason}>{group.reason}</span>
                  </p>

                  <ul className={styles.group__chips}>
                    {group.plants.slice(0, CHIP_LIMIT).map((plant) => (
                      <li key={plant.id} className={styles.group__chip} title={plant.name}>{plant.name}</li>
                    ))}
                    {rest > 0 ? <li className={styles.group__more}>외 {formatNumber(rest)}개소</li> : null}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}

        {latest ? <p className={styles.stack__latest}>최근 수신 <strong>{latest}</strong></p> : null}
      </div>
    </CyberPanel>
  );
}
