import dayjs from 'dayjs';
import { Badge } from '@/components/common/Badge';
import { OPERATION_LABEL, OPERATION_TONE, RTU_LABEL, RTU_TONE } from '@/mocks/status';
import { formatNumber } from '@/utils/format';
import type { Inverter } from '@/interface/equipment';
import type { Rtu } from '@/interface/asset';
import styles from '../History.module.scss';

interface HistoryCriteriaProps {
  date: Date;
  plantLabel: string;
  inverter: Inverter;
  /** 발전소에 물린 RTU. 없으면 정상으로 본다 */
  rtu: Rtu | null;
  /** 그날 올라온 계측 줄 수 */
  rowCount: number;
}

/**
 * 무엇을 어떤 조건으로 보고 있는지 (SFR-009-01/03).
 *
 * 통신상태와 인버터 상태를 함께 적는다 — 계측이 비어 있을 때 인버터가 선 것인지 RTU 가 끊긴
 * 것인지 여기서 갈린다. 둘 중 하나만 적으면 빈 표를 앞에 두고 어디를 손봐야 할지 알 수 없다.
 */
export function HistoryCriteria({ date, plantLabel, inverter, rtu, rowCount }: HistoryCriteriaProps) {
  const interval = rtu?.intervalMinutes ?? null;
  const intervalLabel = interval
    ? `${interval}분 · 하루 ${formatNumber(rowCount)}건`
    : `하루 ${formatNumber(rowCount)}건`;

  return (
    <div className={styles.criteria} aria-label="조회 기준">
      <span className={styles.criteria__label}>조회 기준</span>

      <Item name="기간" value={dayjs(date).format('YYYY-MM-DD')} />
      <Item name="발전소" value={plantLabel} />
      <Item name="인버터" value={inverter.name} />
      <Item name="수집주기" value={intervalLabel} />

      <span className={styles.criteria__item}>
        <span className={styles.criteria__key}>통신상태</span>
        <Badge tone={RTU_TONE[rtu?.status ?? 'normal']} withDot>
          {RTU_LABEL[rtu?.status ?? 'normal']}
        </Badge>
      </span>
      <span className={styles.criteria__item}>
        <span className={styles.criteria__key}>인버터 상태</span>
        <Badge tone={OPERATION_TONE[inverter.ownStatus]} withDot>
          {OPERATION_LABEL[inverter.ownStatus]}
        </Badge>
      </span>
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
