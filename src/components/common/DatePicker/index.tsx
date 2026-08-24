import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { CalendarIcon, ChevronDownIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import { ScrollCalendar } from '@/components/common/DataCalendar/ScrollCalendar';
import { getMonthDays, getYearMonths } from '@/mocks/weather';
import { Modal } from '@/components/common/Modal';
import { formatByGranularity } from '@/utils/date';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { Granularity } from '@/utils/date';
import styles from './DatePicker.module.scss';

interface DatePickerProps {
  /** 폼 칸은 빈 값으로 시작한다 — 그때는 오늘을 기준으로 펴고 자리표시만 보여 준다 */
  value: Date | null;
  onChange: (value: Date) => void;
  /** day = 일자, month = 월, year = 연도 단위로 고른다. */
  granularity: Granularity;
  /** 스크린리더에 읽힐 항목 이름 */
  label: string;
  placeholder?: string;
  disabled?: boolean;
  /** 폼 칸으로 설 때 라벨·오류를 붙이는 쪽이 넘긴다 */
  id?: string;
  invalid?: boolean;
  describedBy?: string;
  /** 여는 버튼 모양을 놓이는 자리에 맞춘다 — 툴바 칩과 폼 입력칸은 높이·모서리가 다르다 */
  className?: string;
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

/*
  달력 칸에 얹는 값은 조회 단위에 따라 갈린다 (SFR-007-01/02, SFR-010-01/02, SFR-022-01/02).
  일 단위는 그 날 날씨, 월·연 단위는 그 기간 발전시간 — 날짜를 고르는 자리라면 어디서든 같다.
*/
const HINT: Record<Granularity, string> = {
  day: '칸마다 그 날 날씨가 함께 나옵니다. 위아래로 굴리면 지난 달과 다음 달이 이어집니다.',
  month: '칸마다 그 달 발전시간이 함께 나옵니다. 위아래로 굴리면 다른 해가 이어집니다.',
  year: '칸마다 그 해 발전시간이 함께 나옵니다. 위아래로 굴리면 지난 해가 이어집니다.',
};

export function DatePicker({
  value,
  onChange,
  granularity,
  label,
  placeholder = '날짜를 고르세요',
  disabled,
  id,
  invalid,
  describedBy,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { plant } = usePlantScope();

  // 값이 없어도 달력은 열려야 한다 — 그때는 오늘 자리에서 펴 준다.
  const shown = value ?? new Date();
  const text = value ? formatByGranularity(value, granularity) : placeholder;

  // 굴려 보는 달력이라 달마다 그때그때 읽어 간다. 조회 대상이 바뀌면 그 발전소 값으로 갈린다.
  const calendar = useMemo(() => ({
    getDays: (year: number, month: number) => getMonthDays(plant?.id ?? null, year, month),
    getMonths: (year: number) => getYearMonths(plant?.id ?? null, year),
  }), [plant?.id]);

  const choose = (next: Date) => {
    onChange(next);
    setIsOpen(false);
  };

  return (
    <>
      <button
        id={id}
        type="button"
        className={cn(styles.trigger, {
          [styles['trigger--empty']]: !value,
          // 넘겨받은 것이 뒤에 와야 호출부가 모양을 덮어쓸 수 있다.
          [className ?? '']: !!className,
        })}
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        aria-label={`${label}: ${text}. 눌러서 변경`}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      >
        <CalendarIcon className={styles.trigger__icon} />
        <span className={styles.trigger__value}>{text}</span>
        <ChevronDownIcon className={styles.trigger__chevron} />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="lg"
        title={TITLE[granularity]}
        description={HINT[granularity]}
        footer={
          <div className={styles.footer}>
            <Button variant="ghost" size="sm" onClick={() => choose(new Date())}>
              {QUICK_LABEL[granularity]}
            </Button>
            <span className={styles.footer__current}>{text}</span>
          </div>
        }
      >
        <ScrollCalendar
          // 조회 단위가 바뀌면 구간 종류가 달라진다 — 상태를 이어받지 않고 새로 깐다.
          key={granularity}
          granularity={granularity}
          selected={shown}
          onSelect={choose}
          getDays={calendar.getDays}
          getMonths={calendar.getMonths}
        />
      </Modal>
    </>
  );
}
