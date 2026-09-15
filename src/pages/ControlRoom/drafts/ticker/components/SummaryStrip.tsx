import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { CountUp } from '@/components/common/CountUp';
import { PauseIcon, PlayIcon } from '@/components/common/Icon';
import { Sparkline } from '@/components/common/Sparkline';
import { formatDelta } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { ControlRoomData } from '@/pages/ControlRoom/useControlRoomData';
import { buildSummaryMetrics, SUMMARY_PER_PAGE } from '../utils/summaryMetrics';
import styles from './SummaryStrip.module.scss';
import type { SummaryMetric } from '../utils/summaryMetrics';

/** 한 묶음을 보여 주는 시간(ms). 세 겹의 리듬 가운데 가장 느린 쪽에 두어, 아래 목록·차트와 박자가 겹치지 않게 한다. */
const PAGE_MS = 12_000;

/** 손을 뗀 뒤 다시 돌기까지(ms) — 아래 목록과 같은 값을 써서 화면 전체가 같은 호흡으로 쉰다. */
const IDLE_MS = 12_000;

/** 견줌 비율의 오름/내림. 0.5% 안쪽은 평(平)으로 본다 — 벽에서 보면 그보다 작은 차는 뜻이 없다. */
function toneOf(delta: number): 'rise' | 'fall' | 'flat' {
  if (Math.abs(delta) < 0.005) return 'flat';

  return delta > 0 ? 'rise' : 'fall';
}

/** 요약 덩이 하나. 그리기만 하는 조각이라 값은 props 로만 받는다. */
function MetricTile({ metric }: { metric: SummaryMetric }) {
  const tone = metric.delta === undefined ? undefined : toneOf(metric.delta);

  return (
    <div className={styles.tile}>
      <span className={styles.tile__spark}>
        {metric.spark.length > 1
          ? <Sparkline values={metric.spark} tone="brand" animate={false} filled width={132} height={30} />
          : null}
      </span>

      <span className={styles.tile__name}>{metric.name}</span>

      <span className={styles.tile__value}>
        {/* 묶음이 바뀌면 CountUp 이 새로 올라간다 — 「새 값이 채워지는」 것으로 읽힌다. 감소 모션이면 바로 최종값. */}
        <CountUp value={metric.amount} fractionDigits={metric.fractionDigits} duration={700} startOnView={false} />
        {metric.countSuffix ? <span className={styles.tile__suffix}>{metric.countSuffix}</span> : null}
        <span className={styles.tile__unit}>{metric.unit}</span>
      </span>

      {tone === undefined ? (
        <span className={styles.tile__note}>{metric.note}</span>
      ) : (
        <span className={cn(styles.tile__pill, styles[`tile__pill--${tone}`])}>
          {`${formatDelta(metric.delta ?? 0)} · ${metric.note}`}
        </span>
      )}
    </div>
  );
}

/**
 * 도 전체 요약 띠 (맨 위).
 *
 * 증권 앱 맨 위의 시장 지표 띠를 옮긴 자리다. 한 행에 넷까지만 두고(밀도는 흉내 내지 않는다),
 * 나머지는 스스로 넘겨 보여 준다 — 한 화면에 담는 양은 늘리지 않으면서 보여 주는 총량만 늘린다.
 *
 * 자동으로 넘기되, 손대면 멈췄다가 손을 뗀 뒤 다시 돈다(아래 목록과 같은 이치). 감소 모션이면
 * 넘김과 연출을 모두 끄고 첫 묶음에 멈춰 선다. 값·시계열은 상위에서 받은 `data` 하나로만 셈한다.
 */
export function SummaryStrip({ data }: { data: ControlRoomData }) {
  const reduceMotion = useReducedMotion();
  const metrics = buildSummaryMetrics(data);
  const pageCount = Math.max(Math.ceil(metrics.length / SUMMARY_PER_PAGE), 1);

  const [page, setPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHeld, setIsHeld] = useState(false);
  const idleTimer = useRef<number | undefined>(undefined);

  const autoOn = isPlaying && !isHeld && !reduceMotion && pageCount > 1;

  useEffect(() => {
    if (!autoOn) return undefined;

    const timer = window.setInterval(() => setPage((prev) => (prev + 1) % pageCount), PAGE_MS);

    return () => window.clearInterval(timer);
  }, [autoOn, pageCount]);

  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  // 손댄 동안 붙잡고, 마지막 손길에서 IDLE_MS 가 지나면 다시 돌린다.
  const hold = () => {
    setIsHeld(true);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIsHeld(false), IDLE_MS);
  };

  const at = page % pageCount;
  const shown = metrics.slice(at * SUMMARY_PER_PAGE, at * SUMMARY_PER_PAGE + SUMMARY_PER_PAGE);

  return (
    <section className={styles.strip} aria-label="관내 요약">
      <div className={styles.strip__body}>
        {reduceMotion ? (
          <div className={styles.page}>
            {shown.map((metric) => <MetricTile key={metric.key} metric={metric} />)}
          </div>
        ) : (
          // 묶음이 바뀔 때만 짧게 스며들고(0.3초) 멈춰 선다. mode="wait" 로 옛 묶음이 빠진 뒤 새 묶음이 들어와 겹치지 않는다.
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={at}
              className={styles.page}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.22, 0.68, 0.32, 1] }}
            >
              {shown.map((metric) => <MetricTile key={metric.key} metric={metric} />)}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {pageCount > 1 ? (
        <div className={styles.pager}>
          <button
            type="button"
            className={styles.pager__toggle}
            aria-pressed={isPlaying}
            aria-label={isPlaying ? '요약 자동 전환 정지' : '요약 자동 전환 재생'}
            onClick={() => { setIsPlaying((prev) => !prev); window.clearTimeout(idleTimer.current); setIsHeld(false); }}
          >
            {isPlaying ? <PauseIcon width={13} height={13} /> : <PlayIcon width={13} height={13} />}
          </button>

          <ol className={styles.pager__dots}>
            {Array.from({ length: pageCount }, (_, index) => (
              <li key={index}>
                <button
                  type="button"
                  className={cn(styles.pager__dot, { [styles['pager__dot--on']]: index === at })}
                  aria-label={`${index + 1}번째 묶음`}
                  aria-current={index === at}
                  onClick={() => { setPage(index); hold(); }}
                />
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
