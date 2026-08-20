import { formatNumber } from '@/utils/format';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import type { OperationStatus } from '@/interface/status';
import type { School } from '@/interface/energy';
import styles from '../DataWall.module.scss';

/** 상태 막대에 세울 결 — 정상부터 끊긴 것까지 다섯 */
const STATES: OperationStatus[] = ['running', 'ready', 'degraded', 'fault', 'commLost'];

/**
 * 상태 분포.
 * 숫자만 적으면 정상 아흔둘과 이상 스물아홉의 비율이 안 잡힌다 — 한 줄짜리 막대가
 * 그 비율을 자리로 보여 주고, 아래 표가 그 자리에 이름을 붙인다.
 */
export function StateBreakdown({ plants, abnormalCount }: { plants: School[]; abnormalCount: number }) {
  const counts = STATES
    .map((status) => ({ status, count: plants.filter((plant) => plant.status === status).length }))
    .filter((item) => item.count > 0);

  return (
    <div className={styles.states}>
      <div
        className={styles.states__bar}
        role="img"
        aria-label={`${formatNumber(plants.length)}개소 중 이상 ${formatNumber(abnormalCount)}개소`}
      >
        {counts.map(({ status, count }) => (
          <span key={status} data-tone={OPERATION_TONE[status]} style={{ flexGrow: count }} />
        ))}
      </div>

      <dl className={styles.states__list}>
        {counts.map(({ status, count }) => (
          <div key={status} data-tone={OPERATION_TONE[status]}>
            <dt>
              <span aria-hidden="true" />
              {OPERATION_LABEL[status]}
            </dt>
            <dd>{formatNumber(count)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
