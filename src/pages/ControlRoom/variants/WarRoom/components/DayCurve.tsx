import { getOutputAt, HOURLY_OUTPUT, PEAK_OUTPUT } from '@/mocks/generation';
import { NOW_HOUR, TODAY } from '@/mocks/today';
import { formatNumber } from '@/utils/format';
import { toneOfAlert } from '@/pages/ControlRoom/useControlRoomData';
import type { AlertRecord } from '@/interface/alert';
import type { AlertTone } from '@/pages/ControlRoom/useControlRoomData';
import styles from '../WarRoom.module.scss';

/*
  판 좌표. 그리는 크기가 아니라 비율을 잡는 값이라 화면 폭과 무관하게 고정해 둔다.
  위쪽이 곡선, 아래쪽 띠가 경보다 — 둘이 같은 가로축을 쓰므로 세로로 눈이 떨어진다.
*/
const VIEW = { width: 1000, height: 250 };
const CURVE_TOP = 16;
const CURVE_BOTTOM = 150;
const AXIS_Y = 158;
const LANE_TOP = 172;
const LANE_BOTTOM = 214;

/** 경보 막대가 가장 많은 시각에서 갖는 높이 */
const LANE_MAX = LANE_BOTTOM - LANE_TOP;

/** 쌓는 차례 — 급한 것이 아래에 깔려 눈이 먼저 닿는다 */
const TONE_ORDER: AlertTone[] = ['critical', 'caution', 'offline'];

const FIRST_HOUR = HOURLY_OUTPUT[0].hour;
const LAST_HOUR = HOURLY_OUTPUT[HOURLY_OUTPUT.length - 1].hour;

/*
  가로 자리.

  아래 히트맵이 시각마다 한 칸을 차지하므로 여기도 칸 가운데에 맞춘다 — 첫 시각을 판 왼쪽 끝에
  붙이면 곡선과 히트맵이 반 칸씩 어긋나, 「10시에 처졌다」 와 「10시에 터졌다」 를 눈으로 이을 수 없다.
  좌우 여백은 SVG 가 아니라 감싸는 칸이 잡는다. 히트맵의 이름·이상 개수 칸과 같은 값을 쓴다.
*/
function xOf(hour: number) {
  return ((hour - FIRST_HOUR + 0.5) / HOURLY_OUTPUT.length) * VIEW.width;
}

function yOf(kw: number) {
  const ratio = PEAK_OUTPUT.kw > 0 ? kw / PEAK_OUTPUT.kw : 0;

  return CURVE_BOTTOM - ratio * (CURVE_BOTTOM - CURVE_TOP);
}

/**
 * 시각마다 무엇이 몇 건 터졌는지.
 *
 * 한 시각을 가장 급한 결 하나로 칠하면 막대가 거의 전부 붉어진다 — 경고 한 건과 통신단절 다섯 건이
 * 같은 그림이 되어, 그 시각에 무슨 일이 있었는지가 사라진다. 결마다 나눠 쌓는다.
 */
interface HourBucket {
  hour: number;
  count: number;
  /** 결별 건수 — `TONE_ORDER` 차례대로 */
  parts: { tone: AlertTone; count: number }[];
}

function bucketsOf(alerts: AlertRecord[]): HourBucket[] {
  const today = TODAY.format('YYYY-MM-DD');
  const byHour = new Map<number, Map<AlertTone, number>>();

  for (const alert of alerts) {
    if (!alert.occurredAt.startsWith(today)) continue;

    const hour = Number(alert.occurredAt.slice(11, 13));

    if (hour < FIRST_HOUR || hour > LAST_HOUR) continue;

    const tone = toneOfAlert(alert);
    const found = byHour.get(hour) ?? new Map<AlertTone, number>();

    found.set(tone, (found.get(tone) ?? 0) + 1);
    byHour.set(hour, found);
  }

  return [...byHour.entries()]
    .map(([hour, tones]) => {
      const parts = TONE_ORDER
        .map((tone) => ({ tone, count: tones.get(tone) ?? 0 }))
        .filter((part) => part.count > 0);

      return { hour, parts, count: parts.reduce((sum, part) => sum + part.count, 0) };
    })
    .sort((a, b) => a.hour - b.hour);
}

/** 점들을 잇는 선. 꺾인 자리가 눈에 걸리지 않게 가로 방향으로만 손잡이를 뻗는다 */
function smoothPath(points: { x: number; y: number }[]): string {
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x},${point.y}`;

    const prev = points[index - 1];
    const half = (point.x - prev.x) / 2;

    return `${path} C ${prev.x + half},${prev.y} ${point.x - half},${point.y} ${point.x},${point.y}`;
  }, '');
}

/** 막대에 마우스를 얹었을 때 읽히는 이름 */
const TONE_LABEL: Record<AlertTone, string> = {
  critical: '경고',
  caution: '주의',
  offline: '통신단절',
};

interface DayCurveProps {
  /** 아직 손대지 않은 경보 — 오늘 것만 아래 띠에 세운다 */
  alerts: AlertRecord[];
}

/**
 * 오늘 하루 (SFR-004-02/14).
 *
 * 다른 시안은 「지금」 만 말한다. 지금 값만으로는 9MW 가 잘 도는 것인지 아침보다 처진 것인지
 * 알 수 없고, 경보 마흔 건이 하루 내내 흩어진 것인지 한 시각에 몰린 것인지도 알 수 없다.
 * 하루를 가로로 눕히면 그 둘이 한눈에 갈린다 — 위는 곡선, 아래는 그 시각에 터진 건수다.
 *
 * 지금 이후는 아직 오지 않은 값이라 점선으로 둔다. 실선과 같은 굵기로 이으면 이미 낸 발전량과
 * 앞으로 낼 발전량이 구분되지 않는다.
 */
export function DayCurve({ alerts }: DayCurveProps) {
  const points = HOURLY_OUTPUT.map((point) => ({ x: xOf(point.hour), y: yOf(point.kw) }));
  const line = smoothPath(points);
  const nowX = xOf(NOW_HOUR);
  const nowY = yOf(getOutputAt(NOW_HOUR));

  const buckets = bucketsOf(alerts);
  const busiest = buckets.reduce((best, bucket) => Math.max(best, bucket.count), 0);
  const totalToday = buckets.reduce((sum, bucket) => sum + bucket.count, 0);

  return (
    <section className={styles.day} aria-label="오늘 발전 곡선과 시각별 경보 발생">
      <header className={styles.day__head}>
        <h2 className={styles.day__title}>오늘 하루</h2>
        <p className={styles.day__legend}>
          <span data-kind="done">실적</span>
          <span data-kind="rest">잔여 예상</span>
          <span data-kind="alert">경보 {formatNumber(totalToday)}건</span>
        </p>
      </header>

      <div className={styles.day__plot}>
        <div className={styles.day__frame}>
          <svg
            className={styles.day__chart}
            viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`정점 ${formatNumber(PEAK_OUTPUT.kw)}kW, 오늘 경보 ${formatNumber(totalToday)}건`}
          >
            <defs>
              <linearGradient id="warroom-day" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--solar)" stopOpacity="0.42" />
                <stop offset="100%" stopColor="var(--solar)" stopOpacity="0" />
              </linearGradient>
              {/* 지금까지만 칠한다 — 아직 내지 않은 발전량을 색으로 채워 두면 이미 낸 것처럼 읽힌다 */}
              <clipPath id="warroom-done">
                <rect x="0" y="0" width={nowX} height={VIEW.height} />
              </clipPath>
            </defs>

            <path
              className={styles.day__area}
              d={`${line} L ${points[points.length - 1].x},${CURVE_BOTTOM} L ${points[0].x},${CURVE_BOTTOM} Z`}
              clipPath="url(#warroom-done)"
            />
            <path className={styles.day__rest} d={line} />
            <path className={styles.day__line} d={line} clipPath="url(#warroom-done)" />

            <line className={styles.day__now} x1={nowX} y1={CURVE_TOP - 8} x2={nowX} y2={LANE_BOTTOM} />

            <line className={styles.day__axis} x1={0} y1={AXIS_Y} x2={VIEW.width} y2={AXIS_Y} />

            {buckets.map((bucket) => {
              const height = busiest > 0 ? Math.max(6, (bucket.count / busiest) * LANE_MAX) : 0;
              const label = bucket.parts.map((part) => `${TONE_LABEL[part.tone]} ${part.count}건`).join(' · ');

              return (
                <g key={bucket.hour}>
                  <title>{`${String(bucket.hour).padStart(2, '0')}시 · ${label}`}</title>
                  {bucket.parts.map((part, index) => {
                    const above = bucket.parts
                      .slice(0, index)
                      .reduce((sum, item) => sum + item.count, 0);

                    return (
                      <rect
                        key={part.tone}
                        className={styles.day__bar}
                        data-tone={part.tone}
                        x={xOf(bucket.hour) - 9}
                        y={LANE_BOTTOM - ((above + part.count) / bucket.count) * height}
                        width={18}
                        height={(part.count / bucket.count) * height}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/*
            지금 자리를 짚는 점은 SVG 밖에 둔다.
            판을 가로로만 늘이므로(preserveAspectRatio=none) 안에 그린 동그라미는 타원이 된다.
            바깥에서 백분율로 얹으면 자리는 그대로 맞으면서 모양이 일그러지지 않는다.
          */}
          <span
            className={styles.day__here}
            style={{ left: `${(nowX / VIEW.width) * 100}%`, top: `${(nowY / VIEW.height) * 100}%` }}
            aria-hidden="true"
          />
        </div>

        {/* 눈금은 SVG 밖에 둔다 — 판을 가로로 늘여도 글자까지 늘어나지 않는다 */}
        <p
          className={styles.day__ticks}
          style={{ '--hours': HOURLY_OUTPUT.length } as React.CSSProperties}
          aria-hidden="true"
        >
          {HOURLY_OUTPUT.map((point) => (
            <span key={point.hour}>{point.hour % 2 === 0 ? String(point.hour).padStart(2, '0') : ''}</span>
          ))}
        </p>
      </div>
    </section>
  );
}
