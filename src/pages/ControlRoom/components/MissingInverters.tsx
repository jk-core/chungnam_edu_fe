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
 * 필요해 여기에 이름으로 늘어놓는다. 오래 끊긴 것부터 세우고, 칸을 넘치면 굴려서 본다.
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

  return (
    <div className={styles.missing}>
      <p className={styles.missing__head}>
        <AlertIcon width={13} height={13} aria-hidden />
        <span className={styles.missing__label}>미수신 인버터</span>
        <span className={styles.missing__count}>{formatNumber(missing.length)}대</span>
      </p>

      {missing.length === 0 ? (
        <p className={styles.missing__none}>지금 값이 안 들어오는 인버터가 없습니다.</p>
      ) : (
        <ul className={styles.missing__list}>
          {missing.map(({ inverter, schoolName, delayMinutes }) => (
            <li key={inverter.id} className={styles.missing__row}>
              <span className={styles.missing__name}>{schoolName} · {inverter.name}</span>
              <span className={styles.missing__meta}>
                {RTU_LABEL[inverter.rtuStatus]}
                {delayMinutes !== null ? ` · ${formatDuration(delayMinutes)} 전` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
