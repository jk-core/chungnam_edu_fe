import dayjs from 'dayjs';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { TODAY } from '@/mocks/today';
import { WEATHER_META } from '@/mocks/weather';
import { buildMonthGrid, CALENDAR_MAX, CALENDAR_MIN, DAY_CALENDAR_MIN, WEEKDAY_LABELS } from '@/utils/date';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import type { DayWeather, MonthPower } from '@/interface/weather';
import type { Granularity } from '@/utils/date';
import styles from './DataCalendar.module.scss';
import { WeatherIcon } from './WeatherIcon';

/*
  처음에 깔아 둘 구간 수와, 끝에 닿을 때마다 더 붙일 구간 수.

  연 단위는 칸이 작아 한 화면에 12년(4열 × 3줄)이 들어간다. 더 붙일 때도 열 수의 배수로만
  늘려 마지막 줄에 한두 칸만 남는 일이 없게 한다.
*/
const WINDOW: Record<Granularity, number> = { day: 7, month: 7, year: 12 };
const STEP: Record<Granularity, number> = { day: 6, month: 6, year: 4 };
/** 끝에서 이만큼 남으면 다음 구간을 붙인다. */
const EDGE = 240;

interface ScrollCalendarProps {
  /** day = 달마다 날짜 칸, month·year = 해마다 12개월 칸 */
  granularity: Granularity;
  selected: Date;
  onSelect: (value: Date) => void;
  getDays: (year: number, month: number) => DayWeather[];
  getMonths: (year: number) => MonthPower[];
}

/** 화면에 깔 구간 하나. 일 단위는 달, 월·연 단위는 해가 한 구간이다. */
interface Section {
  key: string;
  year: number;
  month: number;
}

function sectionOf(granularity: Granularity, cursor: dayjs.Dayjs): Section {
  return granularity === 'day'
    ? { key: cursor.format('YYYY-MM'), year: cursor.year(), month: cursor.month() }
    : { key: cursor.format('YYYY'), year: cursor.year(), month: 0 };
}

function shift(granularity: Granularity, base: dayjs.Dayjs, amount: number): dayjs.Dayjs {
  return granularity === 'day' ? base.add(amount, 'month') : base.add(amount, 'year');
}

/** 조회 단위마다 거슬러 올라갈 수 있는 한계. 일 단위는 칸이 많아 더 좁게 잡는다. */
function floorOf(granularity: Granularity): dayjs.Dayjs {
  return granularity === 'day' ? DAY_CALENDAR_MIN : CALENDAR_MIN;
}

function unitOf(granularity: Granularity): 'month' | 'year' {
  return granularity === 'day' ? 'month' : 'year';
}

/** 달력이 다룰 수 있는 범위를 벗어나지 않게 구간을 만든다. */
function buildSections(granularity: Granularity, from: dayjs.Dayjs, count: number): Section[] {
  const list: Section[] = [];
  const unit = unitOf(granularity);

  for (let index = 0; index < count; index += 1) {
    const cursor = shift(granularity, from, index);

    if (cursor.isBefore(floorOf(granularity), unit)) continue;
    if (cursor.isAfter(CALENDAR_MAX, unit)) break;

    list.push(sectionOf(granularity, cursor));
  }

  return list;
}

/**
 * 고른 자리를 가운데 두되, 범위 끝에 걸리면 시작점을 당겨 칸을 채운다.
 * 그냥 가운데로만 잡으면 끝자락에서 창이 잘려 마지막 줄이 비어 보인다.
 */
function windowStart(granularity: Granularity, cursor: dayjs.Dayjs, count: number): dayjs.Dayjs {
  const unit = unitOf(granularity);
  const latest = shift(granularity, CALENDAR_MAX, -(count - 1));
  const from = shift(granularity, cursor, -Math.floor(count / 2));

  if (from.isAfter(latest, unit)) return latest;
  if (from.isBefore(floorOf(granularity), unit)) return floorOf(granularity);

  return from;
}

/**
 * 위아래로 굴려 보는 달력 (SFR-007-01/02, SFR-010-01/02, SFR-022-01/02).
 *
 * 이전 달 버튼을 눌러 한 칸씩 넘기는 대신 여러 달을 이어 붙여 둔다 — 지난 달과 이번 달을
 * 오가며 견주는 일이 잦아서다. 끝에 다다르면 그만큼 더 붙이고, 위로 붙일 때는 스크롤 위치를
 * 같이 밀어 화면이 튀지 않게 한다.
 */
export function ScrollCalendar({ granularity, selected, onSelect, getDays, getMonths }: ScrollCalendarProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLElement>(null);
  const cursor = dayjs(selected);
  const selectedKey = sectionOf(granularity, cursor).key;

  const [sections, setSections] = useState<Section[]>(
    () => buildSections(granularity, windowStart(granularity, cursor, WINDOW[granularity]), WINDOW[granularity]),
  );

  // 처음 열면 고른 날이 든 구간이 보이도록 맞춘다.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const anchor = anchorRef.current;

    if (!viewport || !anchor) return;

    viewport.scrollTop = anchor.offsetTop - viewport.offsetTop;
  }, []);

  const extend = useCallback((direction: 'up' | 'down') => {
    setSections((prev) => {
      if (prev.length === 0) return prev;

      if (direction === 'down') {
        const last = dayjs(new Date(prev[prev.length - 1].year, prev[prev.length - 1].month, 1));
        const added = buildSections(granularity, shift(granularity, last, 1), STEP[granularity]);

        return added.length > 0 ? [...prev, ...added] : prev;
      }

      const first = dayjs(new Date(prev[0].year, prev[0].month, 1));
      const added = buildSections(granularity, shift(granularity, first, -STEP[granularity]), STEP[granularity]);

      return added.length > 0 ? [...added, ...prev] : prev;
    });
  }, [granularity]);

  const handleScroll = () => {
    const viewport = viewportRef.current;

    if (!viewport) return;

    if (viewport.scrollTop < EDGE) {
      const before = viewport.scrollHeight;

      extend('up');
      // 위로 붙이면 지금 보던 자리가 그만큼 밀린다. 다음 그림 뒤에 되돌려 놓는다.
      requestAnimationFrame(() => {
        if (viewportRef.current) viewportRef.current.scrollTop += viewportRef.current.scrollHeight - before;
      });
    }

    if (viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < EDGE) extend('down');
  };

  return (
    <div className={styles.calendar}>
      <div ref={viewportRef} className={styles.scroll} onScroll={handleScroll}>
        {/* 연도 조회는 해가 곧 칸이다. 머리글 없이 해를 죽 늘어놓는다. */}
        {granularity === 'year' ? (
          <div className={styles.yearList} role="group" aria-label="연도별 발전시간">
            {sections.map((section) => {
              const hours = getMonths(section.year).reduce((sum, item) => sum + item.generationHours, 0);
              const isSelected = section.key === selectedKey;

              return (
                <button
                  key={section.key}
                  ref={isSelected ? (anchorRef as React.RefObject<HTMLButtonElement | null>) : undefined}
                  type="button"
                  className={cn(styles.yearCell, { [styles['yearCell--selected']]: isSelected })}
                  onClick={() => onSelect(dayjs(`${section.year}-01-01`).toDate())}
                  aria-label={`${section.year}년, 발전시간 ${formatNumber(hours, 1)}시간`}
                >
                  <span className={styles.yearCell__label}>{section.year}년</span>
                  <span className={styles.yearCell__hours}>
                    {formatNumber(hours, 1)}
                    <span className={styles.yearCell__unit}>시간</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          sections.map((section) => (
            <div
              key={section.key}
              ref={section.key === selectedKey ? (anchorRef as React.RefObject<HTMLDivElement | null>) : undefined}
              className={styles.scroll__section}
            >
              <p className={styles.scroll__label}>
                {granularity === 'day' ? `${section.year}년 ${section.month + 1}월` : `${section.year}년`}
              </p>

              {granularity === 'day' ? (
                <MonthGrid
                  year={section.year}
                  month={section.month}
                  days={getDays(section.year, section.month)}
                  selected={cursor.format('YYYY-MM-DD')}
                  onSelect={(key) => onSelect(dayjs(key).toDate())}
                />
              ) : (
                <MonthCells
                  year={section.year}
                  months={getMonths(section.year)}
                  selected={cursor.format('YYYY-MM')}
                  onSelect={(key) => onSelect(dayjs(`${key}-01`).toDate())}
                />
              )}
            </div>
          ))
        )}
      </div>

      {granularity === 'day' ? null : (
        <p className={styles.foot}>
          <span>발전시간 = 발전량 ÷ 설비용량</span>
        </p>
      )}
    </div>
  );
}

/** 한 달치 날짜 칸. 일 단위 조회는 그 날 날씨만 얹는다. */
function MonthGrid({
  year,
  month,
  days,
  selected,
  onSelect,
}: {
  year: number;
  month: number;
  days: DayWeather[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  const byDate = new Map(days.map((day) => [day.date, day]));

  return (
    <table className={styles.table}>
      <caption className={styles.table__caption}>{year}년 {month + 1}월 일자별 날씨</caption>
      <thead>
        <tr>
          {WEEKDAY_LABELS.map((weekday, index) => (
            <th
              key={weekday}
              scope="col"
              className={cn(styles.table__weekday, {
                [styles['table__weekday--sun']]: index === 0,
                [styles['table__weekday--sat']]: index === 6,
              })}
            >
              {weekday}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {chunk(buildMonthGrid(year, month), 7).map((week, weekIndex) => (
          <tr key={weekIndex}>
            {week.map((cell, dayIndex) => {
              if (!cell) {
                return (
                  <td key={dayIndex} className={styles.cellWrap}>
                    <div className={cn(styles.cell, styles['cell--empty'])} />
                  </td>
                );
              }

              const key = cell.format('YYYY-MM-DD');
              const data = byDate.get(key);

              return (
                <td key={dayIndex} className={styles.cellWrap}>
                  <button
                    type="button"
                    className={cn(styles.cell, {
                      [styles['cell--selected']]: key === selected,
                      [styles['cell--today']]: key === TODAY.format('YYYY-MM-DD'),
                    })}
                    onClick={() => onSelect(key)}
                    aria-current={key === selected ? 'date' : undefined}
                    aria-label={data
                      ? `${cell.format('M월 D일')}, ${WEATHER_META[data.kind].label}`
                      : cell.format('M월 D일')}
                  >
                    <span className={styles.cell__top}>
                      <span
                        className={cn(styles.cell__day, {
                          [styles['cell__day--sun']]: dayIndex === 0,
                          [styles['cell__day--sat']]: dayIndex === 6,
                        })}
                      >
                        {cell.date()}
                      </span>
                      {data ? (
                        <WeatherIcon
                          kind={data.kind}
                          size={17}
                          className={cn(styles.cell__weather, styles[`cell__weather--${data.kind}`])}
                        />
                      ) : null}
                    </span>
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** 한 해치 월 칸. 월 단위 조회는 그 달 발전시간만 얹는다. */
function MonthCells({
  year,
  months,
  selected,
  onSelect,
}: {
  year: number;
  months: MonthPower[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className={styles.yearGrid} role="group" aria-label={`${year}년 월별 발전시간`}>
      {months.map((item, index) => (
        <button
          key={item.month}
          type="button"
          className={cn(styles.monthCell, { [styles['monthCell--selected']]: item.month === selected })}
          onClick={() => onSelect(item.month)}
          aria-label={`${year}년 ${index + 1}월, 발전시간 ${item.generationHours}시간`}
        >
          <span className={styles.monthCell__label}>{index + 1}월</span>
          <span className={styles.monthCell__hours}>
            {item.generationHours.toFixed(1)}
            <span className={styles.monthCell__unit}>시간</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size));
}
