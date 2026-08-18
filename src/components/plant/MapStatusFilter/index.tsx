import { useMemo, useState } from 'react';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { OPERATION_LABEL, OPERATION_ORDER, OPERATION_TONE } from '@/mocks/status';
import type { OperationStatus } from '@/interface/status';
import type { School } from '@/interface/energy';
import styles from './MapStatusFilter.module.scss';

/**
 * 지도에 찍힌 발전소를 상태로 걸러 본다.
 *
 * 범례가 곧 필터다. 색과 이름만 적어 두었을 때는 「경고 11개소」를 읽고도 그 열한 곳이
 * 어디인지 보려면 눈으로 점을 훑어야 했다 — 누를 수 있게 하면 나머지를 걷어내고 그 열한 곳만
 * 남길 수 있다.
 *
 * 아무것도 고르지 않은 상태가 전부 보기다. 하나를 끄는 것이 아니라 볼 것을 고르는 쪽이라야,
 * 「경고만」 을 보려고 셋을 연달아 끄지 않아도 된다.
 */
export function useStatusFilter(plants: School[]) {
  const [picked, setPicked] = useState<OperationStatus[]>([]);

  const counts = useMemo(() => {
    const map = {} as Record<OperationStatus, number>;

    OPERATION_ORDER.forEach((status) => {
      map[status] = plants.filter((plant) => plant.status === status).length;
    });

    return map;
  }, [plants]);

  const visible = useMemo(
    () => (picked.length === 0 ? plants : plants.filter((plant) => picked.includes(plant.status))),
    [plants, picked],
  );

  const toggle = (status: OperationStatus) => {
    setPicked((current) => (
      current.includes(status) ? current.filter((item) => item !== status) : [...current, status]
    ));
  };

  return { picked, counts, visible, toggle, reset: () => setPicked([]) };
}

interface MapStatusFilterProps {
  counts: Record<OperationStatus, number>;
  picked: OperationStatus[];
  onToggle: (status: OperationStatus) => void;
  onReset: () => void;
  /** 값이 0 인 상태는 감춘다 — 누를 수 없는 칸이 줄지어 서면 고를 것이 흐려진다 */
  hideEmpty?: boolean;
}

export function MapStatusFilter({ counts, picked, onToggle, onReset, hideEmpty }: MapStatusFilterProps) {
  const items = OPERATION_ORDER.filter((status) => !hideEmpty || counts[status] > 0);

  return (
    <div className={styles.filter} role="group" aria-label="상태로 걸러 보기">
      {items.map((status) => {
        const on = picked.includes(status);

        return (
          <button
            key={status}
            type="button"
            className={cn(styles.filter__item, { [styles['filter__item--on']]: on })}
            aria-pressed={on}
            onClick={() => onToggle(status)}
          >
            <span
              className={cn(styles.filter__dot, styles[`filter__dot--${OPERATION_TONE[status]}`])}
              aria-hidden="true"
            />
            {OPERATION_LABEL[status]}
            <span className={styles.filter__count}>{formatNumber(counts[status])}</span>
          </button>
        );
      })}

      {/* 고른 것이 있을 때만 나온다 — 늘 떠 있으면 무엇을 되돌리는 단추인지 알 수 없다 */}
      {picked.length > 0 ? (
        <button type="button" className={styles.filter__reset} onClick={onReset}>
          전체 보기
        </button>
      ) : null}
    </div>
  );
}
