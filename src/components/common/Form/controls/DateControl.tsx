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
  /** 그대로 서버로 나가고 비교·정렬도 이 형태로 한다 */
  value: string;
  onChange: (value: string) => void;
  granularity?: Granularity;
  placeholder?: string;
}

/**
 * 툴바의 `DatePicker` 와 다른 물건이다 — 거기는 알약, 여기는 옆 글자칸과 같은 상자다.
 * 달력 창(`CalendarModal`)만 함께 쓴다.
 */
export function DateControl({
  value,
  onChange,
  granularity = 'day',
  placeholder = '날짜를 고르세요',
  className,
  disabled,
  id,
  // button role 은 aria-required 를 지원하지 않는다 — 라벨의 * 와 저장 시 오류가 그 몫을 한다.
  'aria-required': _required,
  ...rest
}: DateControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const picked = value ? dayjs(value).toDate() : null;

  return (
    <>
      <button
        {...rest}
        id={id}
        type="button"
        className={cn(styles.dateControl, !picked && styles['dateControl--empty'], className)}
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        /*
          라벨만 걸면 버튼 이름이 「설치일시」에서 끝나고 고른 날짜는 안 읽힌다.
          자기 자신을 함께 가리켜 라벨 뒤에 내용(날짜)을 붙인다.
        */
        aria-labelledby={id ? `${id}-label ${id}` : undefined}
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
