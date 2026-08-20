import { formatNumber, scaleSi } from '@/utils/format';
import styles from '../WarRoom.module.scss';

/** 누적 한 줄 — 단위를 자동으로 줄여 자릿수가 판을 넘지 않게 한다 */
export function Stat({ label, kwh }: { label: string; kwh: number }) {
  const scaled = scaleSi(kwh, 'Wh');

  return (
    <div className={styles.stack__row}>
      <dt>{label}</dt>
      <dd>
        {formatNumber(scaled.amount, scaled.fractionDigits)}
        <span>{scaled.unit}</span>
      </dd>
    </div>
  );
}

/** 값을 그대로 적는 한 줄 */
export function Line({ label, value, tone }: { label: string; value: string; tone?: 'caution' }) {
  return (
    <div className={styles.stack__row}>
      <dt>{label}</dt>
      <dd data-tone={tone}>{value}</dd>
    </div>
  );
}
