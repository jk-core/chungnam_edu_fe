import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Calendar } from '@/components/common/Calendar';
import { CalendarIcon, ChevronDownIcon } from '@/components/common/Icon';
import { Modal } from '@/components/common/Modal';
import { formatByGranularity } from '@/utils/date';
import type { Granularity } from '@/utils/date';
import styles from './DatePicker.module.scss';

interface DatePickerProps {
  value: Date;
  onChange: (value: Date) => void;
  /** day = 일자, month = 월, year = 연도 단위로 고른다. */
  granularity: Granularity;
  /** 스크린리더에 읽힐 항목 이름 */
  label: string;
}

const TITLE: Record<Granularity, string> = {
  day: '일자 선택',
  month: '월 선택',
  year: '연도 선택',
};

const QUICK_LABEL: Record<Granularity, string> = {
  day: '오늘',
  month: '이번 달',
  year: '올해',
};

export function DatePicker({ value, onChange, granularity, label }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const choose = (next: Date) => {
    onChange(next);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(true)}
        aria-label={`${label}: ${formatByGranularity(value, granularity)}. 눌러서 변경`}
      >
        <CalendarIcon className={styles.trigger__icon} />
        <span className={styles.trigger__value}>{formatByGranularity(value, granularity)}</span>
        <ChevronDownIcon className={styles.trigger__chevron} />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={TITLE[granularity]}
        description="달력을 위아래로 굴리면 여러 달을 빠르게 지나갈 수 있습니다."
        footer={
          <div className={styles.footer}>
            <Button variant="ghost" size="sm" onClick={() => choose(new Date())}>
              {QUICK_LABEL[granularity]}
            </Button>
            <span className={styles.footer__current}>{formatByGranularity(value, granularity)}</span>
          </div>
        }
      >
        <Calendar mode={granularity} selected={value} onSelect={choose} />
      </Modal>
    </>
  );
}
