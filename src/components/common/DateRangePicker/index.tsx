import { useState } from 'react';
import dayjs from 'dayjs';
import { Button } from '@/components/common/Button';
import { Calendar } from '@/components/common/Calendar';
import { CalendarIcon, ChevronDownIcon } from '@/components/common/Icon';
import { Modal } from '@/components/common/Modal';
import { cn } from '@/utils/cn';
import { formatShort } from '@/utils/date';
import styles from './DateRangePicker.module.scss';

export interface DateRangeValue {
  start: Date;
  end: Date;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  label: string;
}

const PRESETS: { label: string; days: number }[] = [
  { label: '최근 7일', days: 7 },
  { label: '최근 30일', days: 30 },
  { label: '최근 90일', days: 90 },
  { label: '최근 1년', days: 365 },
];

function makePreset(days: number): DateRangeValue {
  const end = dayjs().startOf('day');

  return { start: end.subtract(days - 1, 'day').toDate(), end: end.toDate() };
}

export function DateRangePicker({ value, onChange, label }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<{ start: Date | null; end: Date | null }>(value);
  const [preview, setPreview] = useState<Date | null>(null);

  // 모달을 다시 열 때는 항상 지금 적용된 기간에서 출발한다.
  const open = () => {
    setDraft(value);
    setPreview(null);
    setIsOpen(true);
  };

  const handleSelect = (date: Date) => {
    // 시작만 정해진 상태면 이번 클릭이 끝점이다. 그 외에는 새 기간을 시작한다.
    if (draft.start && !draft.end) {
      const [start, end] = dayjs(date).isBefore(draft.start) ? [date, draft.start] : [draft.start, date];

      setDraft({ start, end });
      setPreview(null);

      return;
    }

    setDraft({ start: date, end: null });
    setPreview(null);
  };

  const apply = () => {
    if (!draft.start) return;

    onChange({ start: draft.start, end: draft.end ?? draft.start });
    setIsOpen(false);
  };

  const draftLabel = draft.start
    ? `${formatShort(draft.start)} ~ ${draft.end ? formatShort(draft.end) : '끝나는 날 선택'}`
    : '시작하는 날 선택';

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={open}
        aria-label={`${label}: ${formatShort(value.start)}부터 ${formatShort(value.end)}까지. 눌러서 변경`}
      >
        <CalendarIcon className={styles.trigger__icon} />
        <span className={styles.trigger__value}>
          {formatShort(value.start)}
          <span className={styles.trigger__tilde}>~</span>
          {formatShort(value.end)}
        </span>
        <ChevronDownIcon className={styles.trigger__chevron} />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="조회 기간 선택"
        description="시작하는 날과 끝나는 날을 차례로 누르세요. 달력은 위아래로 굴려 빠르게 지나갈 수 있습니다."
        footer={
          <div className={styles.footer}>
            <span className={cn(styles.footer__draft, { [styles['footer__draft--pending']]: !draft.end })}>
              {draftLabel}
            </span>
            <div className={styles.footer__actions}>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                취소
              </Button>
              <Button size="sm" onClick={apply} disabled={!draft.start}>
                적용
              </Button>
            </div>
          </div>
        }
      >
        <div className={styles.presets}>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={styles.preset}
              onClick={() => setDraft(makePreset(preset.days))}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <Calendar
          mode="day"
          range={draft}
          preview={preview}
          onPreview={setPreview}
          onSelect={handleSelect}
        />
      </Modal>
    </>
  );
}
