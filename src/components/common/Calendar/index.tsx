import { useEffect, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import {
  buildMonthGrid,
  CALENDAR_MAX,
  CALENDAR_MIN,
  DAY_CALENDAR_MIN,
  listMonths,
  listYears,
  WEEKDAY_LABELS,
} from '@/utils/date';
import { cn } from '@/utils/cn';
import { getMonthDays } from '@/mocks/weather';
import { usePlantScope } from '@/hooks/usePlantScope';
import { WeatherIcon } from '@/components/common/DataCalendar/WeatherIcon';
import type { Granularity } from '@/utils/date';
import styles from './Calendar.module.scss';

export interface CalendarRange {
  start: Date | null;
  end: Date | null;
}

interface CalendarProps {
  mode: Granularity;
  /** 단일 선택 값 */
  selected?: Date | null;
  /** 기간 선택 값. 주면 범위 모드로 그린다. */
  range?: CalendarRange;
  /** 범위 선택 도중 커서가 놓인 날짜 — 끝점 미리보기에 쓴다. */
  preview?: Date | null;
  onPreview?: (value: Date | null) => void;
  onSelect: (value: Date) => void;
}

/**
 * 연속 스크롤 달력.
 * 이전·다음 버튼으로 한 달씩 넘기는 대신 세로 스크롤로 여러 달을 한 번에 지나간다.
 * 월 제목은 스크롤 중에도 상단에 붙어 지금 어디인지 알려 준다.
 */
export function Calendar({ mode, selected, range, preview, onPreview, onSelect }: CalendarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const { plant } = usePlantScope();

  const months = useMemo(
    () => (mode === 'day' ? listMonths(DAY_CALENDAR_MIN, CALENDAR_MAX) : []),
    [mode],
  );
  const years = useMemo(() => listYears(CALENDAR_MIN, CALENDAR_MAX), []);

  // 열자마자 선택된 지점이 보이도록 스크롤 위치를 맞춘다.
  useEffect(() => {
    const align = () => {
      const container = scrollRef.current;
      const anchor = anchorRef.current;

      if (!container || !anchor) return;

      container.scrollTop = Math.max(0, anchor.offsetTop - container.offsetTop - 8);
    };

    align();

    // 첫 계산 뒤에도 모달 레이아웃과 웹폰트가 자리를 잡으며 높이가 밀린다.
    // 36개월치 높이라 몇 백 px만 어긋나도 다른 달이 보이므로 안정된 뒤 한 번 더 맞춘다.
    const frame = requestAnimationFrame(align);

    document.fonts?.ready.then(align);

    return () => cancelAnimationFrame(frame);
  }, [mode]);

  const isRangeMode = Boolean(range);
  const rangeStart = range?.start ? dayjs(range.start) : null;
  // 끝점을 아직 안 고른 동안에는 커서 위치를 임시 끝점으로 쓴다.
  const rangeEnd = range?.end ? dayjs(range.end) : preview ? dayjs(preview) : null;
  const [lower, upper] = rangeStart && rangeEnd && rangeEnd.isBefore(rangeStart)
    ? [rangeEnd, rangeStart]
    : [rangeStart, rangeEnd];

  const dayState = (date: dayjs.Dayjs) => {
    if (!isRangeMode) {
      return { selected: selected ? date.isSame(dayjs(selected), 'day') : false, start: false, end: false, inRange: false };
    }

    const isStart = Boolean(lower && date.isSame(lower, 'day'));
    const isEnd = Boolean(upper && date.isSame(upper, 'day'));
    const inRange = Boolean(lower && upper && date.isAfter(lower, 'day') && date.isBefore(upper, 'day'));

    return { selected: isStart || isEnd, start: isStart, end: isEnd, inRange };
  };

  const anchorKey = useMemo(() => {
    const base = dayjs(range?.start ?? selected ?? new Date());

    if (mode === 'day') return base.format('YYYY-MM');

    return String(base.year());
  }, [mode, range?.start, selected]);

  return (
    <div className={styles.calendar}>
      {mode === 'day' ? (
        <div className={styles.calendar__weekdays} aria-hidden="true">
          {WEEKDAY_LABELS.map((weekday) => (
            <span key={weekday} className={styles.calendar__weekday}>
              {weekday}
            </span>
          ))}
        </div>
      ) : null}

      <div className={styles.calendar__scroller} ref={scrollRef} tabIndex={0} role="group" aria-label="달력">
        {mode === 'day'
          ? months.map((month) => {
            /*
              그 달 날씨를 한 번만 읽어 날짜로 꺼내 쓴다 (SFR-007-01).
              목업이 날짜별로 값을 캐시하므로 달마다 다시 만들어도 값이 흔들리지 않는다.
            */
            const weather = new Map(
              getMonthDays(plant?.id ?? null, month.year, month.month)
                .map((item) => [Number(item.date.slice(8, 10)), item.kind]),
            );

            return (
              <section
                key={month.key}
                className={styles.calendar__section}
                ref={month.key === anchorKey ? anchorRef : undefined}
              >
                <h3 className={styles.calendar__monthTitle}>{month.label}</h3>
                <div className={styles.calendar__grid}>
                  {buildMonthGrid(month.year, month.month).map((date, index) => {
                    if (!date) return <span key={`empty-${index}`} className={styles.calendar__empty} />;

                    const state = dayState(date);
                    const isToday = date.isSame(dayjs(), 'day');
                    const kind = weather.get(date.date()) ?? null;

                    return (
                      <button
                        key={date.format('YYYY-MM-DD')}
                        type="button"
                        className={cn(styles.day, {
                          [styles['day--selected']]: state.selected,
                          [styles['day--start']]: state.start,
                          [styles['day--end']]: state.end,
                          [styles['day--inRange']]: state.inRange,
                          [styles['day--today']]: isToday,
                          [styles['day--weekend']]: date.day() === 0 || date.day() === 6,
                        })}
                        aria-pressed={state.selected}
                        aria-label={`${date.year()}년 ${date.month() + 1}월 ${date.date()}일`}
                        onClick={() => onSelect(date.toDate())}
                        onMouseEnter={() => onPreview?.(date.toDate())}
                      >
                        <span className={styles.day__number}>{date.date()}</span>
                        {kind ? (
                          <WeatherIcon
                            kind={kind}
                            size={12}
                            className={cn(styles.day__weather, styles[`day__weather--${kind}`])}
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })
          : null}

        {mode === 'month'
          ? years.map((year) => (
            <section
              key={year}
              className={styles.calendar__section}
              ref={String(year) === anchorKey ? anchorRef : undefined}
            >
              <h3 className={styles.calendar__monthTitle}>{year}년</h3>
              <div className={styles.calendar__monthGrid}>
                {Array.from({ length: 12 }, (_, month) => {
                  const date = dayjs(new Date(year, month, 1));
                  const isSelected = selected
                    ? date.isSame(dayjs(selected).startOf('month'), 'month')
                    : false;

                  return (
                    <button
                      key={month}
                      type="button"
                      className={cn(styles.chunk, { [styles['chunk--selected']]: isSelected })}
                      aria-pressed={isSelected}
                      onClick={() => onSelect(date.toDate())}
                    >
                      {month + 1}월
                    </button>
                  );
                })}
              </div>
            </section>
          ))
          : null}

        {mode === 'year' ? (
          <section className={styles.calendar__section} ref={anchorRef}>
            <div className={styles.calendar__monthGrid}>
              {years.map((year) => {
                const isSelected = selected ? dayjs(selected).year() === year : false;

                return (
                  <button
                    key={year}
                    type="button"
                    className={cn(styles.chunk, { [styles['chunk--selected']]: isSelected })}
                    aria-pressed={isSelected}
                    onClick={() => onSelect(new Date(year, 0, 1))}
                  >
                    {year}년
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
