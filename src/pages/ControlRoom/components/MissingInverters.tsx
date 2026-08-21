import { useLayoutEffect, useRef, useState } from 'react';
import { AlertIcon } from '@/components/common/Icon';
import { getSchoolById } from '@/mocks/schools';
import { INVERTERS } from '@/mocks/equipment';
import { RTU_LABEL } from '@/mocks/status';
import { formatDuration, formatNumber } from '@/utils/format';
import type { CollectionStatus } from '@/interface/collection';
import styles from './MissingInverters.module.scss';

interface MissingInvertersProps {
  /** 조회 조건에 걸린 발전소 id — 이 안의 인버터만 센다 */
  plantIds: Set<string>;
  /** 발전소별 수집 현황 — 마지막 수신이 언제였는지 적는다 */
  collection: Map<string, CollectionStatus>;
}

/**
 * 미수신 인버터 목록 (SFR-004-05).
 *
 * 위 지표는 "미수신 14대" 처럼 수만 알려 준다. 실제로 손을 대려면 어느 학교 어느 인버터인지가
 * 필요해 여기에 이름으로 늘어놓는다. 오래 끊긴 것부터 세운다.
 *
 * 벽에 걸어 두는 화면이라 굴려서 보지 않는다 — 자리가 주는 만큼만 펴고 못 담은 것은 수로 적는다.
 * 같은 판이 관제 본 화면과 데이터 월 한 칸에 모두 들어가고 높이가 두 배 넘게 차이 나므로,
 * 줄 수를 미리 정하지 않고 **제가 놓인 자리를 재서** 정한다.
 */

export function MissingInverters({ plantIds, collection }: MissingInvertersProps) {
  // RTU가 정상이 아닌 인버터 — 값이 아예 안 들어오거나 끊긴 것들이다.
  const missing = INVERTERS
    .filter((inverter) => inverter.rtuStatus !== 'normal' && plantIds.has(inverter.schoolId))
    .map((inverter) => ({
      inverter,
      schoolName: getSchoolById(inverter.schoolId)?.name ?? '',
      delayMinutes: collection.get(inverter.schoolId)?.delayMinutes ?? null,
    }))
    .sort((a, b) => (b.delayMinutes ?? 0) - (a.delayMinutes ?? 0));

  const listRef = useRef<HTMLUListElement>(null);
  const [fits, setFits] = useState(missing.length);

  /*
    자리에 들어가는 만큼만 편다.

    같은 판이 관제 본 화면과 데이터 월 한 칸에 모두 들어가고 높이가 두 배 넘게 차이 나므로
    줄 수를 미리 정할 수 없다. 상자가 실제로 넘쳤는지를 보고 한 줄씩 줄이고, 자리가 남으면
    다시 늘린다 — 재는 시점에 따라 높이가 달라져도 결국 맞는 자리에 멎는다.
  */
  useLayoutEffect(() => {
    const list = listRef.current;

    if (!list) return undefined;

    const measure = () => {
      const rows = list.children;
      const first = rows[0] as HTMLElement | undefined;
      const last = rows[rows.length - 1] as HTMLElement | undefined;

      if (!first || !last) return;

      const gap = parseFloat(getComputedStyle(list).rowGap) || 0;
      // 한 줄이 차지하는 자리 — 두 줄의 시작 위치 차이가 여백까지 포함한 실제 한 칸이다.
      const second = rows[1] as HTMLElement | undefined;
      const step = second ? second.offsetTop - first.offsetTop : first.offsetHeight + gap;

      // 화면에서 내려가 있거나 아직 자리를 못 잡은 순간에는 재지 않는다 — 0 을 재면 한 줄까지 줄어든다.
      if (step <= 0 || list.clientHeight <= 0) return;

      /*
        담긴 줄들이 실제로 차지한 높이.
        `scrollHeight` 는 상자보다 작아지지 않아 남는 자리를 알려 주지 못한다 — 그것만 보고
        늘리려 하면 한 줄로 줄어든 뒤 영영 돌아오지 못한다.
      */
      const content = last.offsetTop + last.offsetHeight - first.offsetTop;
      const room = Math.max(1, Math.floor((list.clientHeight + gap) / step));

      if (content > list.clientHeight || room !== rows.length) {
        setFits(Math.min(missing.length, room));
      }
    };

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(list);

    return () => observer.disconnect();
  }, [missing.length, fits]);

  const shown = missing.slice(0, fits);

  return (
    <div className={styles.missing}>
      <p className={styles.missing__head}>
        <AlertIcon width={13} height={13} aria-hidden />
        <span className={styles.missing__label}>미수신 인버터</span>
        <span className={styles.missing__count}>{formatNumber(missing.length)}대</span>
      </p>

      {missing.length === 0 ? (
        <p className={styles.missing__none}>미수신 인버터가 없습니다.</p>
      ) : (
        <>
          <ul className={styles.missing__list} ref={listRef}>
            {shown.map(({ inverter, schoolName, delayMinutes }) => (
              <li key={inverter.id} className={styles.missing__row}>
                <span className={styles.missing__name}>{schoolName} · {inverter.name}</span>
                <span className={styles.missing__meta}>
                  {RTU_LABEL[inverter.rtuStatus]}
                  {delayMinutes !== null ? ` · ${formatDuration(delayMinutes)} 전` : ''}
                </span>
              </li>
            ))}
          </ul>

          {/* 자리에 못 담은 것은 수로만 알린다 — 숨겨 두면 없는 것이 된다 */}
          {missing.length > shown.length ? (
            <p className={styles.missing__more}>외 {formatNumber(missing.length - shown.length)}대</p>
          ) : null}
        </>
      )}
    </div>
  );
}
