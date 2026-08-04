import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRightIcon, MonitorIcon, SchoolIcon, UserIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import { formatDuration } from '@/utils/format';
import type { FaultTimeline } from '@/interface/faultTimeline';
import styles from './FaultGantt.module.scss';
import type { CSSProperties } from 'react';

/** 하루 칸 너비(px) — 날짜 눈금과 막대가 같은 자를 쓴다. */
const DAY_WIDTH = 30;
const ROW_HEIGHT = 40;
const MONTH_ROW_HEIGHT = 24;
const DAY_ROW_HEIGHT = 28;
const HEADER_HEIGHT = MONTH_ROW_HEIGHT + DAY_ROW_HEIGHT;
/** 이 폭보다 좁은 막대에는 글자를 넣지 않는다 */
const BAR_LABEL_MIN_WIDTH = 56;
const BAR_MIN_WIDTH = 6;
/** 폭을 재기 전에 가정하는 화면 너비 */
const FALLBACK_VIEW_WIDTH = 960;

/** 막대 구분 — 통신 장애는 설비 고장과 원인이 달라 갈라 놓는다 (SFR-015-02). */
type BarTone = 'critical' | 'caution' | 'offline';

const TONE_LABEL: Record<BarTone, string> = {
  caution: '주의',
  critical: '경고',
  offline: '통신단절',
};

const TONE_ORDER: BarTone[] = ['caution', 'critical', 'offline'];

interface Bar {
  item: FaultTimeline;
  tone: BarTone;
  left: number;
  width: number;
  /** 급한 것이 위로 올라오도록 */
  priority: number;
  manual: boolean;
}

interface Row {
  id: string;
  kind: 'plant' | 'device';
  name: string;
  depth: number;
  count: number;
  expandable: boolean;
  expanded: boolean;
  bars: Bar[];
  onToggle?: () => void;
}

interface FaultGanttProps {
  rows: FaultTimeline[];
  from: dayjs.Dayjs;
  to: dayjs.Dayjs;
  onSelect: (item: FaultTimeline) => void;
}

/**
 * 고장 구간을 발전소별 막대로 늘어놓는다 (SFR-015-01/02).
 * 표로는 잘 안 보이는 "같은 시기에 몰린 고장"과 "오래 끌고 있는 건"이 한눈에 드러난다.
 * 발전소 줄을 펼치면 어느 설비에서 난 일인지까지 내려간다.
 */
export function FaultGantt({ rows, from, to, onSelect }: FaultGanttProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [hidden, setHidden] = useState<BarTone[]>([]);
  // 지금 화면에 걸친 구간 — 눈금은 이 범위만 그린다.
  const [viewport, setViewport] = useState({ left: 0, width: 0 });

  const totalDays = Math.max(1, to.diff(from, 'day') + 1);
  const totalWidth = totalDays * DAY_WIDTH;

  const days = useMemo(() => Array.from({ length: totalDays }, (_, index) => {
    const day = from.add(index, 'day');

    return {
      key: day.format('YYYY-MM-DD'),
      date: day.date(),
      left: index * DAY_WIDTH,
      firstOfMonth: day.date() === 1,
      weekend: day.day() === 0 || day.day() === 6,
      sunday: day.day() === 0,
      today: day.isSame(to, 'day'),
    };
  }), [from, to, totalDays]);

  // 달이 바뀌는 지점마다 머리글을 나눠 어느 달을 보고 있는지 잃지 않게 한다.
  const months = useMemo(() => {
    const acc: { key: string; label: string; left: number; width: number }[] = [];

    days.forEach((day) => {
      const key = day.key.slice(0, 7);
      const last = acc[acc.length - 1];

      if (last && last.key === key) last.width += DAY_WIDTH;
      else acc.push({ key, label: key.replace('-', '.'), left: day.left, width: DAY_WIDTH });
    });

    return acc;
  }, [days]);

  const barsOf = (items: FaultTimeline[]): Bar[] => items.map((item) => {
    const startAt = dayjs(item.startedAt);
    const endAt = item.endedAt ? dayjs(item.endedAt) : to;
    const tone = toneOf(item);

    return {
      item,
      tone,
      left: Math.max(0, startAt.diff(from, 'day', true)) * DAY_WIDTH,
      width: Math.max(BAR_MIN_WIDTH, endAt.diff(startAt, 'day', true) * DAY_WIDTH),
      priority: tone === 'critical' ? 3 : tone === 'caution' ? 2 : 1,
      manual: item.steps.some((step) => step.manual),
    };
  }).filter((bar) => !hidden.includes(bar.tone));

  const gridRows = useMemo<Row[]>(() => {
    const byPlant = new Map<string, FaultTimeline[]>();

    rows.forEach((row) => {
      byPlant.set(row.plantId, [...(byPlant.get(row.plantId) ?? []), row]);
    });

    return [...byPlant.entries()].flatMap(([plantId, items]) => {
      const isOpen = expanded.includes(plantId);
      const plantRow: Row = {
        id: plantId,
        kind: 'plant',
        name: items[0].plantName,
        depth: 0,
        count: items.length,
        expandable: true,
        expanded: isOpen,
        bars: barsOf(items),
        onToggle: () => setExpanded((prev) => (
          prev.includes(plantId) ? prev.filter((id) => id !== plantId) : [...prev, plantId]
        )),
      };

      if (!isOpen) return [plantRow];

      const byDevice = new Map<string, FaultTimeline[]>();

      items.forEach((item) => {
        byDevice.set(item.deviceName, [...(byDevice.get(item.deviceName) ?? []), item]);
      });

      return [
        plantRow,
        ...[...byDevice.entries()].map(([name, deviceItems]) => ({
          id: `${plantId}-${name}`,
          kind: 'device' as const,
          name,
          depth: 1,
          count: deviceItems.length,
          expandable: false,
          expanded: false,
          bars: barsOf(deviceItems),
        })),
      ];
    });
    // barsOf 는 hidden·from·to 에서만 달라진다 — 목록 자체와 함께 다시 만든다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, expanded, hidden, from, to]);

  // 최근이 오른쪽 끝이라, 열자마자 거기부터 보이게 한다.
  useEffect(() => {
    const node = scrollRef.current;

    if (!node) return;

    node.scrollLeft = node.scrollWidth;
    setViewport({ left: node.scrollLeft, width: node.clientWidth });
  }, [totalWidth, rows.length]);

  const syncViewport = () => {
    const node = scrollRef.current;

    if (node) setViewport({ left: node.scrollLeft, width: node.clientWidth });
  };

  // 아직 폭을 재기 전이면 대략의 화면 폭을 가정한다 — 그래야 스크롤을 따라간다.
  const viewWidth = viewport.width || FALLBACK_VIEW_WIDTH;

  // 앞뒤로 한 화면씩 더 그려 스크롤 중에 눈금이 비지 않게 한다.
  const visibleDays = useMemo(() => {
    const startIndex = Math.max(0, Math.floor((viewport.left - viewWidth) / DAY_WIDTH));
    const endIndex = Math.min(days.length, Math.ceil((viewport.left + viewWidth * 2) / DAY_WIDTH));

    return days.slice(startIndex, endIndex);
  }, [days, viewport.left, viewWidth]);

  const visibleMonths = useMemo(() => months.filter((month) => (
    month.left + month.width >= viewport.left - viewWidth && month.left <= viewport.left + viewWidth * 2
  )), [months, viewport.left, viewWidth]);

  if (rows.length === 0) return null;

  const todayLeft = days[days.length - 1]?.left ?? 0;

  return (
    <div className={styles.gantt}>
      <div className={styles.layout}>
        <div className={styles.labelCol}>
          <div className={styles.labelHead} style={{ height: HEADER_HEIGHT }}>
            <span>발전소 · 설비</span>
            <span className={styles.labelHead__meta}>{gridRows.length}행</span>
          </div>
          {gridRows.map((row) => (
            <div
              key={row.id}
              className={cn(styles.label, styles[`label--${row.kind}`])}
              style={{ height: ROW_HEIGHT, paddingLeft: 12 + row.depth * 18 }}
            >
              {row.expandable ? (
                <button
                  type="button"
                  className={styles.expand}
                  aria-expanded={row.expanded}
                  aria-label={`${row.name} ${row.expanded ? '접기' : '펼치기'}`}
                  onClick={row.onToggle}
                >
                  <ChevronRightIcon
                    className={cn(styles.expand__icon, { [styles['expand__icon--open']]: row.expanded })}
                    width={13}
                    height={13}
                    aria-hidden
                  />
                </button>
              ) : (
                <span className={styles.expand__spacer} aria-hidden />
              )}
              {row.kind === 'plant'
                ? <SchoolIcon width={13} height={13} aria-hidden />
                : <MonitorIcon width={13} height={13} aria-hidden />}
              <span className={styles.label__name}>{row.name}</span>
              <span className={styles.label__count}>{row.count}</span>
            </div>
          ))}
        </div>

        <div
          ref={scrollRef}
          className={styles.scroll}
          role="region"
          tabIndex={0}
          aria-label="고장 구간 타임라인"
          onScroll={syncViewport}
        >
          <div className={styles.inner} style={{ width: `${totalWidth}px` }}>
            <div className={styles.timeHead} style={{ height: HEADER_HEIGHT, width: `${totalWidth}px` }}>
              <div className={styles.monthRow} style={{ height: MONTH_ROW_HEIGHT }}>
                {visibleMonths.map((month) => (
                  <span
                    key={month.key}
                    className={styles.month}
                    style={{ left: `${month.left}px`, width: `${month.width}px` }}
                  >
                    {month.label}
                  </span>
                ))}
              </div>
              <div className={styles.dayRow} style={{ height: DAY_ROW_HEIGHT }}>
                {visibleDays.map((day) => (
                  <span
                    key={day.key}
                    className={cn(styles.day, {
                      [styles['day--monthFirst']]: day.firstOfMonth,
                      [styles['day--weekend']]: day.weekend,
                      [styles['day--sunday']]: day.sunday,
                      [styles['day--today']]: day.today,
                    })}
                    style={{ left: `${day.left}px`, width: `${DAY_WIDTH}px` }}
                    title={day.today ? '오늘' : undefined}
                  >
                    {day.date}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.body} style={{ '--day-width': `${DAY_WIDTH}px` } as CSSProperties}>
              {/* 오늘 자리를 세로선으로 그어 지금이 어디인지 잃지 않게 한다 */}
              <span className={styles.todayLine} style={{ left: `${todayLeft}px` }} aria-hidden />

              {gridRows.map((row) => (
                <div key={row.id} className={cn(styles.lane, styles[`lane--${row.kind}`])} style={{ height: ROW_HEIGHT }}>
                  {row.bars.map((bar) => (
                    <button
                      key={bar.item.id}
                      type="button"
                      className={cn(styles.bar, styles[`bar--${bar.tone}`], {
                        [styles['bar--ongoing']]: !bar.item.resolved,
                      })}
                      style={{ left: `${bar.left}px`, width: `${bar.width}px`, zIndex: bar.priority }}
                      title={`${bar.item.plantName} · ${bar.item.deviceName} · ${bar.item.startedAt} 발생 · ${formatDuration(durationOf(bar.item, to))} 경과${bar.item.resolved ? '' : ' · 진행 중'}`}
                      onClick={() => onSelect(bar.item)}
                    >
                      {bar.width >= BAR_LABEL_MIN_WIDTH ? (
                        <span className={styles.bar__label}>{bar.item.deviceName}</span>
                      ) : null}
                      {bar.manual ? (
                        <span className={styles.bar__manual} title="수동 조치" aria-hidden>
                          <UserIcon width={9} height={9} />
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.legend}>
        {TONE_ORDER.map((tone) => (
          <button
            key={tone}
            type="button"
            className={cn(styles.legend__item, { [styles['legend__item--off']]: hidden.includes(tone) })}
            aria-pressed={!hidden.includes(tone)}
            onClick={() => setHidden((prev) => (
              prev.includes(tone) ? prev.filter((item) => item !== tone) : [...prev, tone]
            ))}
          >
            <span className={cn(styles.legend__swatch, styles[`swatch--${tone}`])} aria-hidden />
            {TONE_LABEL[tone]}
          </button>
        ))}
        <span className={styles.legend__item}>
          <span className={`${styles.legend__swatch} ${styles['swatch--ongoing']}`} aria-hidden />
          진행 중 (사선)
        </span>
        <span className={styles.legend__item}>
          <UserIcon width={11} height={11} aria-hidden />
          수동 조치된 건
        </span>
        <span className={styles.legend__hint}>막대를 누르면 단계별 이력을 봅니다. 범례를 누르면 그 구분을 숨깁니다.</span>
      </div>
    </div>
  );
}

function durationOf(item: FaultTimeline, to: dayjs.Dayjs): number {
  const endAt = item.endedAt ? dayjs(item.endedAt) : to;

  return endAt.diff(dayjs(item.startedAt), 'minute');
}

/** 통신 장애는 설비 고장과 무게가 달라 색을 따로 쓴다 (SFR-015-02). */
function toneOf(item: FaultTimeline): BarTone {
  if (item.source === 'system') return 'offline';

  return item.resolved ? 'caution' : 'critical';
}
