import dayjs from 'dayjs';
import { ChevronRightIcon } from '@/components/common/Icon';
import { TARIFF_NOTE } from '@/mocks/tariff';
import { TODAY } from '@/mocks/today';
import { WEATHER_META } from '@/mocks/weather';
import { buildMonthGrid, WEEKDAY_LABELS } from '@/utils/date';
import { cn } from '@/utils/cn';
import { formatCurrency, formatNumber } from '@/utils/format';
import type { DayWeather, MonthWeather } from '@/interface/weather';
import styles from './DataCalendar.module.scss';
import { WeatherIcon } from './WeatherIcon';

interface DataCalendarProps {
  /** month = 한 달 일 그리드, year = 12개월 그리드 */
  view: 'month' | 'year';
  year: number;
  /** view='month' 일 때만 쓴다 */
  month?: number;
  days?: DayWeather[];
  months?: MonthWeather[];
  /** 선택된 키. 일이면 YYYY-MM-DD, 월이면 YYYY-MM */
  selected?: string | null;
  onSelect?: (key: string) => void;
  onNavigate?: (year: number, month?: number) => void;
  /**
   * 칸에 절감액까지 얹을지.
   * 요구사항은 일 단위 조회에 날씨와 발전시간을, 월·연 단위에 발전시간과 절감액을
   * 요구한다 (SFR-007-01/02, SFR-010-01/02, SFR-022-01/02). 그래서 발전시간은 늘 두고
   * 금액만 여닫는다.
   */
  showSaving?: boolean;
}

/**
 * 달력 각 칸에 날씨와, 필요하면 발전시간·절감액을 얹어 보여 준다 (SFR-010-01/02).
 * 날짜를 고르는 피커(Calendar)와 목적이 달라 따로 두되, 월 그리드 계산은 buildMonthGrid 를 그대로 쓴다.
 * 표(table)로 짜서 스크린리더가 읽는 순서가 곧 달력 순서가 된다.
 */
export function DataCalendar({
  view,
  year,
  month = 0,
  days = [],
  months = [],
  selected,
  onSelect,
  onNavigate, showSaving = true }: DataCalendarProps) {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const label = view === 'month' ? `${year}년 ${month + 1}월` : `${year}년`;

  const move = (delta: number) => {
    if (!onNavigate) return;

    if (view === 'year') {
      onNavigate(year + delta);

      return;
    }

    const next = dayjs(new Date(year, month, 1)).add(delta, 'month');

    onNavigate(next.year(), next.month());
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.head}>
        <p className={styles.head__label}>{label}</p>
        <div className={styles.head__nav}>
          <button
            type="button"
            className={styles.head__button}
            onClick={() => move(-1)}
            aria-label={view === 'year' ? '이전 연도' : '이전 달'}
          >
            <ChevronRightIcon width={16} height={16} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button
            type="button"
            className={styles.head__button}
            onClick={() => move(1)}
            aria-label={view === 'year' ? '다음 연도' : '다음 달'}
          >
            <ChevronRightIcon width={16} height={16} />
          </button>
        </div>
      </div>

      {view === 'month' ? (
        <table className={styles.table}>
          <caption className={styles.table__caption}>
            {label} 일자별 날씨 · 발전시간{showSaving ? ' · 절감액' : ''}
          </caption>
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
                  const saving = data ? formatCurrency(data.savingWon) : null;
                  const isToday = key === TODAY.format('YYYY-MM-DD');

                  return (
                    <td key={dayIndex} className={styles.cellWrap}>
                      <button
                        type="button"
                        className={cn(styles.cell, {
                          [styles['cell--selected']]: key === selected,
                          [styles['cell--today']]: isToday,
                        })}
                        onClick={() => onSelect?.(key)}
                        aria-current={key === selected ? 'date' : undefined}
                        aria-label={data
                          ? showSaving
                            ? `${cell.format('M월 D일')}, ${WEATHER_META[data.kind].label}, 발전시간 ${data.generationHours}시간, 절감액 ${formatNumber(data.savingWon)}원`
                            : `${cell.format('M월 D일')}, ${WEATHER_META[data.kind].label}, 발전시간 ${data.generationHours}시간`
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
                        {data ? <span className={styles.cell__hours}>{data.generationHours.toFixed(1)}h</span> : null}
                        {showSaving && saving ? (
                          <span className={styles.cell__revenue}>
                            {saving.value}
                            {saving.unit}
                          </span>
                        ) : null}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.yearGrid} role="group" aria-label={`${year}년 월별 발전시간·절감액`}>
          {months.map((item, index) => {
            const saving = formatCurrency(item.savingWon);

            return (
              <button
                key={item.month}
                type="button"
                className={cn(styles.monthCell, { [styles['monthCell--selected']]: item.month === selected })}
                onClick={() => onSelect?.(item.month)}
                aria-label={`${index + 1}월, ${WEATHER_META[item.kind].label} 우세, 발전시간 ${item.generationHours}시간, 절감액 ${formatNumber(item.savingWon)}원`}
              >
                <span className={styles.monthCell__top}>
                  <span className={styles.monthCell__label}>{index + 1}월</span>
                  <WeatherIcon
                    kind={item.kind}
                    size={16}
                    className={cn(styles.cell__weather, styles[`cell__weather--${item.kind}`])}
                  />
                </span>
                <span className={styles.monthCell__hours}>
                  {item.generationHours.toFixed(1)}
                  <span className={styles.monthCell__unit}>시간</span>
                </span>
                <span className={styles.monthCell__revenue}>
                  {saving.value}
                  {saving.unit}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <p className={styles.foot}>
        <span>발전시간 = 발전량 ÷ 설비용량</span>
        <span>{TARIFF_NOTE}</span>
      </p>
    </div>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size));
}
