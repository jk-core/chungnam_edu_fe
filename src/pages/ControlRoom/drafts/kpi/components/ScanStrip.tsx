import { useEffect, useMemo, useRef, useState } from 'react';
import { AiOrbit } from '@/components/common/AiOrbit';
import { isAbnormal, OPERATION_LABEL, OPERATION_RANK, OPERATION_TONE } from '@/mocks/status';
import { formatNumber, formatRelative } from '@/utils/format';
import { NOW } from '@/mocks/today';
import type { AlertRecord } from '@/interface/alert';
import type { CollectionStatus } from '@/interface/collection';
import type { School } from '@/interface/energy';
import { FaultGroupModal } from '@/pages/ControlRoom/components/FaultGroupModal';
import styles from './ScanStrip.module.scss';

/**
 * 실시간 이상 감지 — 지금 비치고 있는 시·군에서 손봐야 할 곳.
 *
 * 범위는 옆 지도가 당겨 보여 주는 시·군 하나다. 순회가 계룡시로 넘어가면 이 목록도 계룡시 것만
 * 센다 — 위 도형·당긴 지도·이 목록 셋이 같은 곳을 가리켜야 화면이 한 덩이로 읽힌다.
 *
 * 세우는 것은 **이상이 걸린 곳뿐**이다. 칸을 채우려고 정상까지 함께 세워 보았지만, 손봐야 할 것을
 * 찾는 자리에 손볼 것 없는 줄이 열 줄 서 있으면 정작 급한 두 줄이 그 사이에 묻힌다. 개소 수와
 * 정상 몫은 머리 줄과 위 상세 칸이 이미 말한다.
 *
 * 쪽을 자동으로 넘기지 않는다. 넘겨 보았더니 지금 보이는 것이 전부가 아니라는 사실을 늘 의심하게
 * 되고, 급한 줄이 화면 밖에 있는 동안은 없는 것과 같았다. 들어가는 만큼만 세우고 나머지는
 * 「더보기」 가 모달로 펴 준다.
 *
 * 열 이름을 세운다. 「24kW」 만 적혀 있으면 그것이 설비 크기인지 지금 내는 힘인지 알 수 없다 —
 * 설비용량과 발생 일시를 이름으로 못 박아 두면 숫자가 저 혼자 해석되지 않는다.
 *
 * 발생 일시는 시각이 아니라 **얼마나 됐는지**로 적는다. 「07-30 23:45」 는 지금이 며칠인지 알아야
 * 읽히지만 「48일 전」 은 그 자체로 급한 정도를 말한다 — 벽에 걸어 두고 지나가며 보는 화면에서는
 * 날짜를 셈하게 두면 안 읽힌다.
 */

/** 줄 하나가 차지하는 높이(px) — 스타일의 `$row-h` 와 같은 값이라야 셈이 맞는다 */
const ROW_H = 30;

interface ScanStripProps {
  /** 지금 비치고 있는 시·군의 발전소 */
  plants: School[];
  regionName: string;
  /** 전체보기 모달이 마지막 수신 시각을 함께 적는다 */
  collection: Map<string, CollectionStatus>;
  /** 아직 손대지 않은 알림 — 학교마다 언제부터 걸렸는지를 여기서 센다 */
  alerts: AlertRecord[];
}

export function ScanStrip({ plants, regionName, collection, alerts }: ScanStripProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [capacity, setCapacity] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  /*
    칸에 몇 줄이 들어가는지 잰다.
    창 크기가 바뀌거나 조회 조건이 좁혀지면 칸도 달라지므로 한 번 재고 끝내지 않는다.
  */
  useEffect(() => {
    const node = listRef.current;

    if (!node) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setCapacity(Math.max(1, Math.floor(entry.contentRect.height / ROW_H)));
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  /*
    학교마다 **가장 먼저 걸린** 알림의 시각.

    한 학교에 알림이 여럿 걸려 있을 수 있는데, 물어야 할 것은 「언제부터 이러고 있나」 이므로
    나중 것이 아니라 처음 것을 잡는다 — 최근 것을 잡으면 며칠째 방치된 설비가 방금 난 일처럼
    보인다.
  */
  const occurredAt = useMemo(() => {
    const out = new Map<string, string>();

    alerts.forEach((alert) => {
      const kept = out.get(alert.schoolId);

      if (!kept || alert.occurredAt < kept) out.set(alert.schoolId, alert.occurredAt);
    });

    return out;
  }, [alerts]);

  // 급한 것부터, 같으면 설비가 큰 곳부터 — 큰 설비가 멈추면 잃는 양도 크다
  const found = useMemo(() => plants
    .filter((plant) => isAbnormal(plant.status))
    .sort((a, b) => OPERATION_RANK[a.status] - OPERATION_RANK[b.status] || b.capacityKw - a.capacityKw),
  [plants]);

  /*
    들어가는 만큼만 세운다.

    한때 여기서 한 줄을 더 뺐다 — 「더보기」 가 설 자리를 떼어 두려던 것인데, 그 단추는 목록 칸의
    형제라 칸 높이에서 이미 빠져 있었다. 두 번 뺀 탓에 다섯 건 가운데 한 건만 서고 나머지 넷이
    모두 더보기로 밀렸다.
  */
  const shown = found.length > capacity ? found.slice(0, capacity) : found;
  const hidden = found.length - shown.length;

  return (
    <section className={styles.scan} aria-label="실시간 이상 감지">
      <p className={styles.scan__head}>
        <AiOrbit size={24} active />
        <span className={styles.scan__name}>실시간 이상 감지</span>
        <span className={styles.scan__count} data-on={found.length > 0 ? '' : undefined}>
          {regionName} {formatNumber(plants.length)}개소 중 {formatNumber(found.length)}
        </span>
      </p>

      {found.length === 0 ? (
        <p className={styles.scan__none}>
          <strong>{regionName}</strong>
          에서 잡힌 이상이 없습니다.
        </p>
      ) : (
        <>
          {/* 숫자가 저 혼자 해석되지 않도록 열 이름을 세운다 */}
          <p className={styles.head}>
            <span className={styles.head__name}>학교</span>
            <span className={styles.head__capacity}>설비용량</span>
            <span className={styles.head__seen}>발생 일시</span>
            <span className={styles.head__state}>상태</span>
          </p>

          <div ref={listRef} className={styles.scan__list}>
            <ul className={styles.rows}>
              {shown.map((plant) => (
                <li key={plant.id} className={styles.row} data-tone={OPERATION_TONE[plant.status]}>
                  <span className={styles.row__name}>{plant.name}</span>
                  <span className={styles.row__capacity}>
                    {formatNumber(plant.capacityKw)}
                    <i>kW</i>
                  </span>
                  {/* 걸린 지 얼마나 됐는지 — 「48일 전」 이 「07-30」 보다 급한 정도를 곧바로 말한다 */}
                  <span className={styles.row__seen}>
                    {occurredAt.has(plant.id)
                      ? formatRelative(new Date(occurredAt.get(plant.id)!.replace(' ', 'T')), NOW.toDate())
                      : '—'}
                  </span>
                  <span className={styles.row__state}>{OPERATION_LABEL[plant.status]}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {hidden > 0 ? (
        <button type="button" className={styles.scan__more} onClick={() => setIsOpen(true)}>
          {`+${formatNumber(hidden)}곳 더보기`}
        </button>
      ) : null}

      {/*
        나머지는 상황판이 쓰던 목록 모달로 편다 — 이 화면만의 목록을 새로 만들면 거르개·정렬이 두
        벌이 되고, 한쪽만 고쳐지는 날이 온다. 첫 거르개는 가장 급한 상태로 연다.
      */}
      {isOpen && found.length > 0 ? (
        <FaultGroupModal
          plants={plants}
          collection={collection}
          status={found[0].status}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </section>
  );
}
