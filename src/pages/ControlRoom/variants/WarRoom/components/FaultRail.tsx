import { formatNumber } from '@/utils/format';
import { isAbnormal } from '@/mocks/status';
import type { ControlRoomData } from '@/pages/ControlRoom/useControlRoomData';
import styles from '../WarRoom.module.scss';
import { FaultRow } from './FaultRow';

/** 오른쪽 — 지금 손봐야 할 것. 지도의 붉은 점이 무엇인지 여기서 이름을 얻는다. */
export function FaultRail({ data }: { data: ControlRoomData }) {
  const faults = data.rows.filter((plant) => isAbnormal(plant.status));

  return (
    <aside className={styles.rail} aria-label="장애 발생 현황">
      <section className={`${styles.glass} ${styles.glass__grow}`}>
        <h2 className={styles.glass__title}>
          장애 발생
          <em className={styles.count} data-empty={faults.length === 0 ? '' : undefined}>
            {formatNumber(faults.length)}
          </em>
        </h2>

        {faults.length === 0 ? (
          <p className={styles.calm}>이상 설비가 없습니다.</p>
        ) : (
          <ul className={styles.faults}>
            {faults.map((plant) => (
              <FaultRow key={plant.id} plant={plant} last={data.collection.byId.get(plant.id)?.lastCollectedAt} />
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
