import { formatNumber } from '@/utils/format';
import styles from '../Triage.module.scss';

interface FigureProps {
  label: string;
  amount: number;
  unit: string;
  digits: number;
  tone?: 'ok';
  children: React.ReactNode;
}

/** 오른쪽 요약의 숫자 한 칸 */
export function Figure({ label, amount, unit, digits, tone, children }: FigureProps) {
  return (
    <div className={styles.figure} data-tone={tone}>
      <span className={styles.figure__label}>{label}</span>
      <p className={styles.figure__value}>
        {formatNumber(amount, digits)}
        <span>{unit}</span>
      </p>
      <span className={styles.figure__note}>{children}</span>
    </div>
  );
}
