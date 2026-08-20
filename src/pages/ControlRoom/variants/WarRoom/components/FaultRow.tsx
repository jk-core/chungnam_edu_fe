import { currentOutputOf } from '@/mocks/schoolOutput';
import { formatNumber } from '@/utils/format';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import type { School } from '@/interface/energy';
import styles from '../WarRoom.module.scss';

/** 이상 설비 한 줄 — 상태 색 띠가 왼쪽에 서서 목록을 색으로 훑게 한다 */
export function FaultRow({ plant, last }: { plant: School; last?: string }) {
  return (
    <li className={styles.fault} data-tone={OPERATION_TONE[plant.status]}>
      <span className={styles.fault__name}>{plant.name}</span>
      <span className={styles.fault__state}>{OPERATION_LABEL[plant.status]}</span>
      <span className={styles.fault__meta}>
        {formatNumber(currentOutputOf(plant), 1)}kW
        {last ? ` · ${last.slice(11, 16)}` : ''}
      </span>
    </li>
  );
}
