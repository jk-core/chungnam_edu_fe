import dayjs from 'dayjs';
import { COLLECT_INTERVAL_MINUTE } from '@/configs/collect';
import type { Inverter } from '@/interface/equipment';
import styles from '../History.module.scss';

interface HistoryCriteriaProps {
  date: Date;
  plantLabel: string;
  inverter: Inverter;
}

/**
 * 무엇을 어떤 조건으로 보고 있는지 (SFR-009-01/03).
 *
 * 통신상태·인버터 상태는 적지 않는다 — 둘을 합친 값이 곧 설비 운전상태라 조회 대상 패널이
 * 이미 그리고 있고, 통신이 끊기면 프로시저가 그 상태를 통신단절로 바꿔 준다.
 * 그날 올라온 줄 수도 여기서 세지 않는다. 표 아래 쪽나눔이 「전체 N건」으로 답한다.
 */
export function HistoryCriteria({ date, plantLabel, inverter }: HistoryCriteriaProps) {
  return (
    <div className={styles.criteria} aria-label="조회 기준">
      <span className={styles.criteria__label}>조회 기준</span>

      <Item name="기간" value={dayjs(date).format('YYYY-MM-DD')} />
      <Item name="발전소" value={plantLabel} />
      <Item name="인버터" value={inverter.name} />
      <Item name="수집주기" value={`${COLLECT_INTERVAL_MINUTE}분`} />
    </div>
  );
}

/** 이름과 값 한 쌍 — 같은 모양이 네 번 되풀이된다 */
function Item({ name, value }: { name: string; value: string }) {
  return (
    <span className={styles.criteria__item}>
      <span className={styles.criteria__key}>{name}</span>
      <span className={styles.criteria__value}>{value}</span>
    </span>
  );
}
