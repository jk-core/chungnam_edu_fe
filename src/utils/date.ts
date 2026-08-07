import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

export type Granularity = 'day' | 'month' | 'year';

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/*
  달력이 다루는 기간.

  연 단위 조회는 예전 실적까지 죽 훑어보는 자리라 12년치를 연다 — 학교 태양광 설비가
  2010년대 중반부터 깔린 것을 감안한 범위다. 목업은 어느 해든 시드로 만들어 낸다.
*/
export const CALENDAR_MIN = dayjs('2015-01-01');
export const CALENDAR_MAX = dayjs('2026-12-31');

/** 일 단위 달력은 최근 3년치만 그린다. 더 넓히면 셀이 수천 개가 된다. */
export const DAY_CALENDAR_MIN = dayjs('2024-01-01');

export const toDayjs = (value: Date | string) => dayjs(value);

export const toIso = (value: Date | Dayjs) => dayjs(value).format('YYYY-MM-DD');

export const fromIso = (iso: string) => dayjs(iso).toDate();

/** 선택 단위에 맞춰 사람이 읽는 라벨을 만든다. */
export function formatByGranularity(value: Date, granularity: Granularity): string {
  const date = dayjs(value);

  if (granularity === 'year') return `${date.year()}년`;
  if (granularity === 'month') return `${date.year()}년 ${date.month() + 1}월`;

  return `${date.year()}. ${date.month() + 1}. ${date.date()}. (${WEEKDAY_LABELS[date.day()]})`;
}

/** 2026. 6. 30. 형태의 짧은 표기 */
export function formatShort(value: Date): string {
  const date = dayjs(value);

  return `${date.year()}. ${date.month() + 1}. ${date.date()}.`;
}

export function isSameDay(a: Date | Dayjs, b: Date | Dayjs): boolean {
  return dayjs(a).isSame(dayjs(b), 'day');
}

export interface MonthKey {
  key: string;
  year: number;
  /** 0~11 */
  month: number;
  label: string;
}

/** min~max 사이의 모든 월을 오래된 순으로 만든다. */
export function listMonths(min: Dayjs, max: Dayjs): MonthKey[] {
  const months: MonthKey[] = [];
  let cursor = min.startOf('month');
  const last = max.startOf('month');

  while (!cursor.isAfter(last)) {
    months.push({
      key: cursor.format('YYYY-MM'),
      year: cursor.year(),
      month: cursor.month(),
      label: `${cursor.year()}년 ${cursor.month() + 1}월`,
    });
    cursor = cursor.add(1, 'month');
  }

  return months;
}

export function listYears(min: Dayjs, max: Dayjs): number[] {
  const years: number[] = [];

  for (let year = min.year(); year <= max.year(); year += 1) years.push(year);

  return years;
}

/**
 * 한 달의 날짜 격자. 앞뒤 빈칸은 null 로 채워 7의 배수로 맞춘다.
 * 빈칸에 이전·다음 달 날짜를 넣지 않는 이유는, 연속 스크롤이라 바로 위아래에 그 달이 이미 있기 때문이다.
 */
export function buildMonthGrid(year: number, month: number): (Dayjs | null)[] {
  const first = dayjs(new Date(year, month, 1));
  const daysInMonth = first.daysInMonth();
  const leading = first.day();
  const cells: (Dayjs | null)[] = Array.from({ length: leading }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) cells.push(dayjs(new Date(year, month, day)));

  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

/**
 * 'YYYY-MM-DD' 또는 'YYYY-MM-DD HH:mm' 문자열이 기간 안에 드는지 본다.
 * 양 끝 날짜는 포함한다.
 */
export function isWithinRange(value: string, start: Date, end: Date): boolean {
  const target = dayjs(value.slice(0, 10));

  return !target.isBefore(dayjs(start), 'day') && !target.isAfter(dayjs(end), 'day');
}

export function clampDate(value: Dayjs, min: Dayjs, max: Dayjs): Dayjs {
  if (value.isBefore(min)) return min;
  if (value.isAfter(max)) return max;

  return value;
}
