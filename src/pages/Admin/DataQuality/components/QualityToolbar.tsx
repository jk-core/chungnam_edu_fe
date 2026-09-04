import { DateRangePicker } from '@/components/common/DateRangePicker';
import { QUALITY_THRESHOLD } from '@/configs/quality';
import { formatNumber } from '@/utils/format';
import type { DateRangeValue } from '@/components/common/DateRangePicker';
import styles from '../../Admin.module.scss';

interface QualityToolbarProps {
  range: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  /** 조회에 걸린 발전소 수 */
  count: number;
}

/** 조회 기간과 걸린 개수 (SFR-012-10). 기준선을 옆에 적어 표의 붉은 줄이 무엇인지 미리 알린다. */
export function QualityToolbar({ range, onChange, count }: QualityToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <DateRangePicker value={range} onChange={onChange} label="품질 조회 기간" />
      <p className={styles.toolbar__note}>
        품질 기준 {Math.round(QUALITY_THRESHOLD * 100)}% · 총 {formatNumber(count)}개소
      </p>
    </div>
  );
}
