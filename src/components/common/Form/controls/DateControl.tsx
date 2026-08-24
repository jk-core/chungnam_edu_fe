import { useState } from 'react';
import dayjs from 'dayjs';
import { CalendarIcon, ChevronDownIcon } from '@/components/common/Icon';
import { CalendarModal } from '@/components/common/DatePicker/CalendarModal';
import { cn } from '@/utils/cn';
import { formatByGranularity } from '@/utils/date';
import type { Granularity } from '@/utils/date';
import styles from '../Form.module.scss';
import type { ComponentPropsWithoutRef } from 'react';

interface DateControlProps extends Omit<ComponentPropsWithoutRef<'button'>, 'value' | 'onChange' | 'type'> {
  /** 폼이 담는 값은 `YYYY-MM-DD` 문자열이다 — 그대로 서버로 나가고 비교·정렬도 이 형태로 한다 */
  value: string;
  onChange: (value: string) => void;
  granularity?: Granularity;
  placeholder?: string;
}

/**
 * 폼에서 날짜를 고르는 칸.
 *
 * 툴바의 `DatePicker` 와 **다른 컴포넌트**다 — 거기는 알약, 여기는 옆 글자칸과 같은 상자다.
 * 달력 창(`CalendarModal`)만 함께 쓴다.
 */
export function DateControl({
  value,
  onChange,
  granularity = 'day',
  placeholder = '날짜를 고르세요',
  className,
  disabled,
  ...rest
}: DateControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const picked = value ? dayjs(value).toDate() : null;

  return (
    <>
      <button
        {...rest}
        type="button"
        className={cn(styles.dateControl, { [styles['dateControl--empty']]: !picked, [className ?? '']: !!className })}
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <CalendarIcon className={styles.dateControl__icon} />
        <span className={styles.dateControl__value}>
          {picked ? formatByGranularity(picked, granularity) : placeholder}
        </span>
        <ChevronDownIcon className={styles.dateControl__chevron} />
      </button>

      <CalendarModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        granularity={granularity}
        value={picked}
        onSelect={(next) => onChange(dayjs(next).format('YYYY-MM-DD'))}
      />
    </>
  );
}
