import { useMemo, useState } from 'react';
import { formatNumber } from '@/utils/format';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import type { CollectionStatus } from '@/interface/collection';
import type { OperationStatus } from '@/interface/status';
import type { School } from '@/interface/energy';
import { buildFaultGroups } from '../utils/faultGroups';
import { FaultGroupModal } from './FaultGroupModal';
import { StatusMix } from './StatusMix';
import styles from './FaultGroups.module.scss';

/**
 * 묶음마다 펴 두는 이름 수.
 *
 * 한 줄에 들어가는 만큼만 편다 — 이름은 몇 개 보이든 「어디가」 를 다 답하지 못하고,
 * 그 답은 더보기가 연 목록이 한다. 대신 아낀 높이를 위 AI 진단 판이 가져간다.
 */
const CHIP_LIMIT = 3;

/*
  묶음 제목만 다르게 부른다 (2026-08-25 사업팀 회의).
  값이 끊긴 것을 「통신단절」이라 하면 회선 고장으로 읽혀, 여기서는 일어난 일 그대로 적는다.
  공용 라벨은 그대로 두었으므로 지도 툴팁·집계표·더보기 목록은 아직 「통신단절」이다.
*/
const GROUP_LABEL: Partial<Record<OperationStatus, string>> = {
  commLost: '데이터 미수신',
};

interface FaultGroupsProps {
  /** 전체 발전소 — 이 중 이상 상태만 묶고, 정상 학교는 기대 발전량의 잣대가 된다 */
  plants: School[];
  /** 발전소별 수집 현황 — 더보기 목록이 마지막 수신 시각을 함께 적는다 */
  collection: Map<string, CollectionStatus>;
}

/**
 * 장애 발생 현황 (SFR-004-08/14).
 *
 * 지도는 "어디가" 아픈지를 답한다. 여기서는 **무엇이 몇 곳이나, 왜 아픈지** 를 상태별로 묶어
 * 답한다 — 한 줄에 한 학교씩 세우면 쉰 곳이 넘는 목록을 넘겨 가며 세어야 하지만, 묶어 두면
 * 통신단절 17 · 경고 17 · 주의 20 이 한눈에 들어온다.
 *
 * 맨 위 상태 분포는 이 묶음들이 관내 전체 몇 곳 가운데 몇 곳인지를 먼저 보여 준다.
 * 이름은 급한 것부터 몇 개만 펴 두고 나머지는 더보기가 모달로 마저 보여 준다.
 */
export function FaultGroups({ plants, collection }: FaultGroupsProps) {
  const groups = useMemo(() => buildFaultGroups(plants), [plants]);
  const [opened, setOpened] = useState<OperationStatus | null>(null);

  return (
    <div className={styles.wrap}>
      <StatusMix plants={plants} />

      {groups.length === 0 ? (
        <p className={styles.empty}>조치가 필요한 설비가 없습니다.</p>
      ) : (
        <ul className={styles.groups}>
          {groups.map((group) => {
            const rest = group.plants.length - CHIP_LIMIT;

            return (
              <li key={group.status} className={styles.group} data-tone={OPERATION_TONE[group.status]}>
                <p className={styles.group__head}>
                  <span className={styles.group__label}>{GROUP_LABEL[group.status] ?? OPERATION_LABEL[group.status]}</span>
                  <strong className={styles.group__count}>{formatNumber(group.plants.length)}</strong>
                  <span className={styles.group__reason}>{group.reason}</span>
                </p>

                <ul className={styles.chips}>
                  {group.plants.slice(0, CHIP_LIMIT).map((plant) => (
                    <li key={plant.id} className={styles.chip} title={plant.name}>{plant.name}</li>
                  ))}
                  {rest > 0 ? (
                    <li>
                      <button type="button" className={styles.more} onClick={() => setOpened(group.status)}>
                        +{formatNumber(rest)} 더보기
                      </button>
                    </li>
                  ) : null}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      {opened ? (
        <FaultGroupModal
          plants={plants}
          collection={collection}
          status={opened}
          onClose={() => setOpened(null)}
        />
      ) : null}
    </div>
  );
}
