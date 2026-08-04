import { Button } from '@/components/common/Button';
import { DatePicker } from '@/components/common/DatePicker';
import { DownloadIcon } from '@/components/common/Icon';
import { PERIOD_META } from '@/mocks/generation';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import type { PeriodKey } from '@/mocks/generation';
import styles from './PeriodFilter.module.scss';

const OPTIONS = (Object.keys(PERIOD_META) as PeriodKey[]).map((key) => ({
  value: key,
  label: PERIOD_META[key].label,
}));

interface PeriodFilterProps {
  period: PeriodKey;
  onPeriodChange: (period: PeriodKey) => void;
  date: Date;
  onDateChange: (date: Date) => void;
  /** 지금 화면이 보여 주는 표를 내려받는다 — 무엇을 담을지는 탭마다 다르다. */
  onDownload: () => void;
}

export function PeriodFilter({ period, onPeriodChange, date, onDateChange, onDownload }: PeriodFilterProps) {
  return (
    <div className={styles.filter}>
      <div className={styles.filter__left}>
        <SegmentedControl label="집계 단위" options={OPTIONS} value={period} onChange={onPeriodChange} />
        <DatePicker value={date} onChange={onDateChange} granularity={period} label="기준일" />
      </div>

      <Button variant="secondary" size="sm" iconLeft={<DownloadIcon />} onClick={onDownload}>
        데이터 내려받기
      </Button>
    </div>
  );
}
