import { Button } from '@/components/common/Button';
import { DatePicker } from '@/components/common/DatePicker';
import { DownloadIcon } from '@/components/common/Icon';
import { PERIOD_META } from '@/mocks/generation';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Select } from '@/components/common/Select';
import type { PeriodKey } from '@/mocks/generation';
import { BASIS_OPTIONS } from '../utils/statBasis';
import styles from './PeriodFilter.module.scss';
import type { StatBasis } from '../utils/statBasis';

const OPTIONS = (Object.keys(PERIOD_META) as PeriodKey[]).map((key) => ({
  value: key,
  label: PERIOD_META[key].label,
}));

interface PeriodFilterProps {
  period: PeriodKey;
  onPeriodChange: (period: PeriodKey) => void;
  date: Date;
  onDateChange: (date: Date) => void;
  /** 무엇을 기준으로 묶어 볼지 (SFR-008-04). 조회 기준을 안 쓰는 화면은 비워 둔다 */
  basis?: StatBasis;
  onBasisChange?: (basis: StatBasis) => void;
  /** 지금 화면이 보여 주는 표를 내려받는다 — 무엇을 담을지는 탭마다 다르다. */
  onDownload: () => void;
}

export function PeriodFilter({
  period,
  onPeriodChange,
  date,
  onDateChange,
  basis,
  onBasisChange,
  onDownload,
}: PeriodFilterProps) {
  return (
    <div className={styles.filter}>
      <div className={styles.filter__left}>
        <SegmentedControl label="집계 단위" options={OPTIONS} value={period} onChange={onPeriodChange} />
        <DatePicker value={date} onChange={onDateChange} granularity={period} label="기준일" />
        {basis && onBasisChange ? (
          <Select label="조회 기준" value={basis} options={BASIS_OPTIONS} onChange={onBasisChange} hideLabel />
        ) : null}
      </div>

      <Button variant="secondary" size="sm" iconLeft={<DownloadIcon />} onClick={onDownload}>
        데이터 내려받기
      </Button>
    </div>
  );
}
