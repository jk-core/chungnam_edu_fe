import dayjs from 'dayjs';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { useDiagnosisRange } from '@/stores/filterStore';
import styles from '../AiDiagnosis.module.scss';
import type { ReactNode } from 'react';

interface AnalysisFilterProps {
  /** 우측에 붙일 보조 정보 (건수 등) */
  trailing?: ReactNode;
}

/** AI진단 전 탭이 공유하는 분석 기간 필터. */
export function AnalysisFilter({ trailing }: AnalysisFilterProps) {
  const [range, setRange] = useDiagnosisRange();
  const days = dayjs(range.end).diff(dayjs(range.start), 'day') + 1;

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbar__left}>
        <DateRangePicker value={range} onChange={setRange} label="분석 기간" />
        <p className={styles.toolbar__note}>분석 기간 {days}일</p>
      </div>
      {trailing}
    </div>
  );
}
