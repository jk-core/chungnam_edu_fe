import { useMemo, useState } from 'react';
import { formatNumber } from '@/utils/format';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import type { CollectionStatus } from '@/interface/collection';
import type { OperationStatus } from '@/interface/status';
import type { School } from '@/interface/energy';
import { buildFaultGroups } from '@/pages/ControlRoom/utils/faultGroups';
import { FaultGroupModal } from '@/pages/ControlRoom/components/FaultGroupModal';
import { StatusRule } from './StatusRule';
import { Panel } from './Panel';
import styles from './FaultPanel.module.scss';

/*
  묶음 제목만 다르게 부른다 (2026-08-25 사업팀 회의).
  값이 끊긴 것을 「통신단절」이라 하면 회선 고장으로 읽혀, 여기서는 일어난 일 그대로 적는다.
  더보기 모달은 공용 라벨(통신단절)을 그대로 쓰므로 이 판의 묶음 머리에서만 바꾼다.
*/
const GROUP_LABEL: Partial<Record<OperationStatus, string>> = {
  commLost: '데이터 미수신',
};

/** 묶음마다 이름으로 펴 두는 개소 수 — 나머지는 더보기가 모달로 마저 보인다 */
const CHIP_LIMIT = 3;

interface FaultPanelProps {
  plants: School[];
  abnormalCount: number;
  collection: Map<string, CollectionStatus>;
}

/**
 * 장애 발생 현황 (SFR-004-08/14) — 아틀라스 판.
 *
 * 담는 것은 A 와 같다 — 맨 위 상태 분포가 관내 몇 곳 가운데 몇 곳인지를 먼저 보이고, 그 아래
 * 이상 상태를 급한 순으로 묶어 건수·원인·대상 개소를 적는다. 그리기만 인쇄물의 결로 바꾼다.
 *
 * A 는 상태마다 색 카드를 세웠지만, 이 시안은 묶음을 **장부의 항목** 으로 적는다 — 상태색은
 * 왼쪽 세로선 한 줄로만 남기고, 건수를 세리프 큰 숫자로 세워 눈이 수부터 잡게 한다.
 * 대상 개소는 급한 것부터 몇 곳만 이름을 펴고 나머지는 더보기(모달)가 맡는다.
 */
export function FaultPanel({ plants, abnormalCount, collection }: FaultPanelProps) {
  const groups = useMemo(() => buildFaultGroups(plants), [plants]);
  const [opened, setOpened] = useState<OperationStatus | null>(null);

  return (
    <Panel title="장애 발생 현황" note={`이상 ${formatNumber(abnormalCount)}개소`}>
      <div className={styles.fault}>
        <StatusRule plants={plants} />

        {groups.length === 0 ? (
          <p className={styles.fault__none}>조치가 필요한 설비가 없습니다.</p>
        ) : (
          <ul className={styles.groups}>
            {groups.map((group) => {
              const rest = group.plants.length - CHIP_LIMIT;

              return (
                <li key={group.status} className={styles.group} data-tone={OPERATION_TONE[group.status]}>
                  <p className={styles.group__head}>
                    <strong className={styles.group__count} data-tone={OPERATION_TONE[group.status]}>
                      {formatNumber(group.plants.length)}
                    </strong>
                    <span className={styles.group__label}>{GROUP_LABEL[group.status] ?? OPERATION_LABEL[group.status]}</span>
                    <span className={styles.group__reason}>{group.reason}</span>
                  </p>

                  <p className={styles.group__names}>
                    {group.plants.slice(0, CHIP_LIMIT).map((plant, at) => (
                      <span key={plant.id} className={styles.group__name}>
                        {at > 0 ? <span className={styles.group__sep} aria-hidden="true">·</span> : null}
                        {plant.name}
                      </span>
                    ))}
                    {rest > 0 ? (
                      <button type="button" className={styles.group__more} onClick={() => setOpened(group.status)}>
                        외 {formatNumber(rest)}곳
                      </button>
                    ) : null}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {opened ? (
        <FaultGroupModal
          plants={plants}
          collection={collection}
          status={opened}
          onClose={() => setOpened(null)}
        />
      ) : null}
    </Panel>
  );
}
