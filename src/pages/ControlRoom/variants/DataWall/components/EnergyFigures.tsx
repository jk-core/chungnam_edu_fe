import { CUMULATIVE } from '@/mocks/generation';
import { formatNumber, scaleSi } from '@/utils/format';
import type { ControlRoomData } from '@/pages/ControlRoom/useControlRoomData';
import styles from '../DataWall.module.scss';

interface FigureProps {
  label: string;
  amount: number;
  unit: string;
  digits: number;
  big?: boolean;
}

/** 발전량 판의 숫자 한 칸 */
function Figure({ label, amount, unit, digits, big }: FigureProps) {
  return (
    <div className={big ? `${styles.figure} ${styles['figure--big']}` : styles.figure}>
      <span className={styles.figure__label}>{label}</span>
      <p className={styles.figure__value}>
        {formatNumber(amount, digits)}
        <span>{unit}</span>
      </p>
    </div>
  );
}

/** 금일부터 누적까지 — 자릿수가 판을 넘지 않게 단위를 올려 적는다 */
export function EnergyFigures({ totals }: { totals: ControlRoomData['totals'] }) {
  const today = scaleSi(totals.todayKwh, 'Wh');
  const total = scaleSi(CUMULATIVE.totalKwh, 'Wh');

  return (
    <div className={styles.figures}>
      <Figure label="금일" amount={today.amount} unit={today.unit} digits={today.fractionDigits} big />
      <Figure label="금월" amount={totals.monthKwh / 1000} unit="MWh" digits={1} />
      <Figure label="금년" amount={totals.yearKwh / 1_000_000} unit="GWh" digits={2} />
      <Figure label="누적" amount={total.amount} unit={total.unit} digits={total.fractionDigits} />
    </div>
  );
}
