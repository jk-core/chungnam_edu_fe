import dayjs from 'dayjs';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { useDiagnosisRange } from '@/stores/filterStore';
import styles from './AnalysisFilter.module.scss';
import type { ReactNode } from 'react';

interface AnalysisFilterProps {
  /** 우측에 붙일 보조 정보 (건수 등) */
  trailing?: ReactNode;
}

/**
 * 분석 기간 조회 조건.
 * AI진단 개요와 현장보고서 점검 일정이 같은 기간을 보고 같은 줄에 세운다.
 */
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
