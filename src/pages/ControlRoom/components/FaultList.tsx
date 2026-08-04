import { Badge } from '@/components/common/Badge';
import { isAbnormal, OPERATION_LABEL, OPERATION_RANK, OPERATION_TONE } from '@/mocks/status';
import { formatDuration, formatNumber } from '@/utils/format';
import { useAutoPager } from '@/hooks/useAutoPager';
import type { CollectionStatus } from '@/interface/collection';
import type { School } from '@/interface/energy';
import { PagerBar } from './PagerBar';
import styles from './FaultList.module.scss';

/** 한 쪽이 머무는 시간 — 목록을 훑을 만큼은 준다 */
const PAGE_MS = 7000;

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
  const faults = plants
    .filter((plant) => isAbnormal(plant.status))
    .sort((a, b) => OPERATION_RANK[a.status] - OPERATION_RANK[b.status] || b.capacityKw - a.capacityKw);

  // 벽면 모니터에는 굴려 줄 사람이 없다. 칸에 담기는 만큼만 두고 나머지는 저절로 넘긴다.
  const {
    frameRef, itemRef, from, to, page, pageCount, turnKey, paused, togglePause, goTo, next, prev,
  } = useAutoPager<HTMLDivElement, HTMLLIElement>({ total: faults.length, intervalMs: PAGE_MS });

  if (faults.length === 0) {
    return <p className={styles.empty}>지금 손봐야 할 설비가 없습니다.</p>;
  }

  return (
    <div className={styles.wrap}>
      <div ref={frameRef} className={styles.frame}>
        {/* 쪽이 갈릴 때마다 새로 만들어야 옆에서 밀려 들어오는 움직임이 다시 돈다 */}
        <ul key={turnKey} className={styles.list}>
          {faults.slice(from, to).map((plant, index) => {
            const status = collection.get(plant.id);

            return (
              <li
                key={plant.id}
                ref={index === 0 ? itemRef : undefined}
                className={`${styles.row} ${styles[`row--${OPERATION_TONE[plant.status]}`]}`}
              >
                <span className={styles.row__main}>
                  <span className={styles.row__name}>{plant.name}</span>
                  <span className={styles.row__region}>{plant.regionName}</span>
                </span>

                <Badge tone={OPERATION_TONE[plant.status]} withDot>
                  {OPERATION_LABEL[plant.status]}
                </Badge>

                <span className={styles.row__figures}>
                  <span className={styles.row__kwh}>
                    {formatNumber(plant.todayKwh)}
                    <span className={styles.row__unit}>kWh</span>
                  </span>
                  {/* 값이 언제부터 안 들어오는지가 대응 순서를 가른다 */}
                  <span className={status && status.delayMinutes > 15 ? styles.row__stale : styles.row__delay}>
                    {status ? `${formatDuration(status.delayMinutes)} 전 수신` : '수집 정보 없음'}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <PagerBar
        page={page}
        pageCount={pageCount}
        turnKey={turnKey}
        intervalMs={PAGE_MS}
        total={faults.length}
        controls={{ paused, onTogglePause: togglePause, onGo: goTo, onPrev: prev, onNext: next }}
      />
    </div>
  );
}
