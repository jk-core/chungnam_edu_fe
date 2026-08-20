import { useMemo } from 'react';
import { formatNumber } from '@/utils/format';
import { isAbnormal } from '@/mocks/status';
import type { AlertRecord } from '@/interface/alert';
import type { ControlRoomData } from '@/pages/ControlRoom/useControlRoomData';
import styles from '../Triage.module.scss';
import { FaultCard } from './FaultCard';

/**
 * 왼쪽 — 손봐야 할 것. 이 화면의 주어다.
 * 제목 옆의 큰 숫자가 곧 오늘의 부담이라, 아래 카드를 세지 않아도 규모가 먼저 읽힌다.
 */
export function TriageColumn({ data }: { data: ControlRoomData }) {
  const faults = useMemo(() => data.rows.filter((plant) => isAbnormal(plant.status)), [data.rows]);

  // 카드에 붙일 경보 한 건 — 같은 발전소의 가장 최근 것을 고른다.
  const alertOf = useMemo(() => {
    const map = new Map<string, AlertRecord>();

    data.openAlerts.forEach((alert) => {
      if (!map.has(alert.schoolId)) map.set(alert.schoolId, alert);
    });

    return map;
  }, [data.openAlerts]);

  return (
    <section className={styles.triage} aria-label="지금 손봐야 할 설비">
      <header className={styles.triage__head}>
        <h2 className={styles.triage__title}>
          지금 손봐야 할 설비
          <em data-empty={faults.length === 0 ? '' : undefined}>{formatNumber(faults.length)}</em>
        </h2>
        <span className={styles.triage__note}>
          미처리 경보 {formatNumber(data.openAlerts.length)}건 · 미수신 {formatNumber(data.collection.stale.length)}개소
        </span>
      </header>

      {faults.length === 0 ? (
        <p className={styles.calm}>
          <strong>관내 이상 설비가 없습니다</strong>
          {formatNumber(data.rows.length)}개소 전부 정상 범위에서 발전 중입니다.
        </p>
      ) : (
        <ul className={styles.cards}>
          {faults.map((plant) => (
            <FaultCard
              key={plant.id}
              plant={plant}
              alert={alertOf.get(plant.id)}
              lastCollectedAt={data.collection.byId.get(plant.id)?.lastCollectedAt}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
