import { useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { isAbnormal, OPERATION_LABEL, OPERATION_RANK, OPERATION_TONE } from '@/mocks/status';
import { formatDuration, formatNumber } from '@/utils/format';
import type { CollectionStatus } from '@/interface/collection';
import type { School } from '@/interface/energy';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import styles from './FaultList.module.scss';

/*
  정렬 기준 (SFR-004-13).

  기본은 상태 우선 — 값이 아예 끊긴 통신단절이 맨 위, 그 다음이 경고·주의다.
  다만 "어느 설비가 가장 오래 손을 안 탔나", "큰 설비부터 보자" 같은 판단도 자주 필요해
  운영자가 축을 바꿔 볼 수 있게 둔다.
*/
type SortKey = 'status' | 'stale' | 'capacity';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'status', label: '상태순' },
  { value: 'stale', label: '미수신순' },
  { value: 'capacity', label: '용량순' },
];

interface FaultListProps {
  /** 전체 발전소 — 이 중 이상 상태만 추린다 */
  plants: School[];
  /** 발전소별 수집 현황 — 마지막으로 값이 들어온 때를 적는다 */
  collection: Map<string, CollectionStatus>;
}

/**
 * 장애 설비 목록 (SFR-004-14).
 *
 * 지도는 "어디가" 아픈지를 답하지만 "무엇이 얼마나" 아픈지는 답하지 못한다.
 * 같은 목록을 글로도 세워, 지도에서 눈에 띈 점을 이름으로 확인할 수 있게 한다.
 * 순서는 화면 전체가 쓰는 상태 우선순위(`OPERATION_RANK`)를 그대로 따른다 —
 * 값이 아예 끊긴 통신단절이 맨 위, 그 다음이 경고·주의다.
 */
export function FaultList({ plants, collection }: FaultListProps) {
  const [sort, setSort] = useState<SortKey>('status');

  const byStatus = (a: School, b: School) =>
    OPERATION_RANK[a.status] - OPERATION_RANK[b.status] || b.capacityKw - a.capacityKw;

  const faults = plants
    .filter((plant) => isAbnormal(plant.status))
    .sort((a, b) => {
      if (sort === 'stale') {
        const delay = (plant: School) => collection.get(plant.id)?.delayMinutes ?? 0;

        // 오래 끊긴 것부터. 같으면 상태 우선순위로 갈라 준다.
        return delay(b) - delay(a) || byStatus(a, b);
      }

      if (sort === 'capacity') return b.capacityKw - a.capacityKw || byStatus(a, b);

      return byStatus(a, b);
    });

  if (faults.length === 0) {
    return <p className={styles.empty}>지금 손봐야 할 설비가 없습니다.</p>;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.sort}>
        <span className={styles.sort__label}>정렬</span>
        <SegmentedControl label="정렬 기준" size="sm" options={SORT_OPTIONS} value={sort} onChange={setSort} />
      </div>

      {/* 손으로 굴려 다 볼 수 있게 둔다 — 쪽을 넘기면 지나간 줄을 다시 찾기 어렵다. */}
      <div className={styles.frame}>
        <ul className={styles.list}>
          {faults.map((plant) => {
            const status = collection.get(plant.id);

            return (
              <li key={plant.id} className={`${styles.row} ${styles[`row--${OPERATION_TONE[plant.status]}`]}`}>
                <span className={styles.row__main}>
                  <span className={styles.row__name}>{plant.name}</span>
                  <span className={styles.row__region}>{plant.regionName}</span>
                </span>

                {/*
                  발전량은 여기서 답할 질문이 아니다 — 이 목록은 "무엇이 얼마나 급한가" 만 본다.
                  상태와, 값이 언제부터 안 들어오는지만 위아래로 둔다.
                */}
                <span className={styles.row__figures}>
                  <Badge tone={OPERATION_TONE[plant.status]} withDot>
                    {OPERATION_LABEL[plant.status]}
                  </Badge>
                  <span className={status && status.delayMinutes > 15 ? styles.row__stale : styles.row__delay}>
                    {status ? `${formatDuration(status.delayMinutes)} 전 수신` : '수집 정보 없음'}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className={styles.count}>전체 {formatNumber(faults.length)}건</p>
    </div>
  );
}
