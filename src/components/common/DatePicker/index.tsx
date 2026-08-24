import { useState } from 'react';
import { CalendarIcon, ChevronDownIcon } from '@/components/common/Icon';
import { formatByGranularity } from '@/utils/date';
import type { Granularity } from '@/utils/date';
import { CalendarModal } from './CalendarModal';
import styles from './DatePicker.module.scss';

interface DatePickerProps {
  value: Date;
  onChange: (value: Date) => void;
  granularity: Granularity;
  /** 스크린리더에 읽힐 항목 이름 */
  label: string;
}

/**
 * 조회 화면 위에서 언제를 볼지 고르는 칩.
 *
 * 폼 칸이 아니다 — 옆에 서는 것이 저장 버튼이 아니라 세그먼트·필터라서 그쪽 키와 알약 모서리를
 * 따른다. 폼 안의 날짜 칸은 `Form.Date`(`Form/controls/DateControl`)가 따로 있다.
 */
export function DatePicker({ value, onChange, granularity, label }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const text = formatByGranularity(value, granularity);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(true)}
        aria-label={`${label}: ${text}. 눌러서 변경`}
      >
        <CalendarIcon className={styles.trigger__icon} />
        <span className={styles.trigger__value}>{text}</span>
        <ChevronDownIcon className={styles.trigger__chevron} />
      </button>

      <CalendarModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        granularity={granularity}
        value={value}
        onSelect={onChange}
      />
    </>
  );
}
