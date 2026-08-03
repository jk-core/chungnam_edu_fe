import { useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { HOURLY_OUTPUT, PEAK_OUTPUT, SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import styles from './SunArc.module.scss';

const VIEW_W = 660;
const HORIZON_Y = 250;
const CX = 330;
const RX = 282;
const RY = 196;
const HOUR_LABELS = [6, 9, 12, 15, 18];

/** 하루 진행률(0~1)을 태양 궤적 위의 좌표로 바꾼다. */
function pointAt(progress: number) {
  const angle = Math.PI * (1 - Math.min(Math.max(progress, 0), 1));

  return { x: CX + RX * Math.cos(angle), y: HORIZON_Y - RY * Math.sin(angle) };
}

function progressOfHour(hour: number) {
  return (hour - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR);
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

interface SunArcProps {
  /** 현재 시각(소수 시간). 일출 전·일몰 후에는 해를 지평선에 붙인다. */
  nowHour: number;
}

/**
 * 시그니처 비주얼.
 * 호(弧)는 오늘 해가 지나는 길, 막대는 그 시각의 실제 발전 출력이다.
 * 막대가 호에 닿으면 일사를 온전히 걷어들인 것이고, 벌어진 만큼이 손실이다.
 */
export function SunArc({ nowHour }: SunArcProps) {
  const gradientId = useId();
  const glowId = useId();
  const reduceMotion = useReducedMotion();
  const targetProgress = Math.min(Math.max(progressOfHour(nowHour), 0), 1);
  const [sunProgress, setSunProgress] = useState(reduceMotion ? targetProgress : 0);
  const frameRef = useRef<number | undefined>(undefined);
  const hasIntroRunRef = useRef(false);

  useEffect(() => {
    // 진입 연출은 한 번만. 이후 시계가 흐르면 해는 새 위치로 바로 옮긴다.
    if (reduceMotion || hasIntroRunRef.current) {
      setSunProgress(targetProgress);

      return;
    }

    hasIntroRunRef.current = true;

    const duration = 1400;
    const delay = 420;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start - delay;

      if (elapsed < 0) {
        frameRef.current = requestAnimationFrame(tick);

        return;
      }

      const ratio = Math.min(elapsed / duration, 1);

      setSunProgress(targetProgress * easeOutCubic(ratio));

      if (ratio < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    };
  }, [targetProgress, reduceMotion]);

  const sun = pointAt(sunProgress);
  const bars = HOURLY_OUTPUT.filter((point) => point.hour >= 6 && point.hour <= 19);

  return (
    <svg
      className={styles.arc}
      viewBox={`0 0 ${VIEW_W} 300`}
      role="img"
      aria-label={`오늘의 태양 궤적과 시간대별 발전 출력. 최고 출력은 ${PEAK_OUTPUT.hour}시 ${PEAK_OUTPUT.kw.toLocaleString('ko-KR')}킬로와트입니다.`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--solar)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="var(--solar)" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor="var(--solar)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--solar)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 해가 지나는 길 */}
      <motion.path
        d={`M ${CX - RX} ${HORIZON_Y} A ${RX} ${RY} 0 0 1 ${CX + RX} ${HORIZON_Y}`}
        className={styles.arc__path}
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      />

      {/* 시간대별 발전 출력 — 호에 닿을수록 일사를 온전히 받은 시간이다 */}
      <g>
        {bars.map((point, index) => {
          const progress = progressOfHour(point.hour);
          const { x, y } = pointAt(progress);
          const ratio = point.kw / PEAK_OUTPUT.kw;
          const height = (HORIZON_Y - y) * ratio;

          return (
            <motion.rect
              key={point.hour}
              x={x - 5}
              y={HORIZON_Y - height}
              width={10}
              height={Math.max(height, 2)}
              rx={5}
              fill={`url(#${gradientId})`}
              style={{ transformOrigin: `${x}px ${HORIZON_Y}px` }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.045, ease: [0.22, 0.68, 0.32, 1] }}
            />
          );
        })}
      </g>

      {/* 지평선 */}
      <line x1={20} y1={HORIZON_Y} x2={VIEW_W - 20} y2={HORIZON_Y} className={styles.arc__horizon} />

      {/* 시각 눈금 */}
      {HOUR_LABELS.map((hour) => {
        const { x } = pointAt(progressOfHour(hour));

        return (
          <text key={hour} x={x} y={HORIZON_Y + 24} className={styles.arc__tick} textAnchor="middle">
            {String(hour).padStart(2, '0')}
          </text>
        );
      })}

      {/* 현재 시각 */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }}>
        <line x1={sun.x} y1={sun.y} x2={sun.x} y2={HORIZON_Y} className={styles.arc__nowLine} />
        <circle cx={sun.x} cy={sun.y} r={44} fill={`url(#${glowId})`} />
        <circle cx={sun.x} cy={sun.y} r={11} className={styles.arc__sun} />
        {!reduceMotion ? (
          <motion.circle
            cx={sun.x}
            cy={sun.y}
            r={11}
            className={styles.arc__pulse}
            fill="none"
            animate={{ r: [11, 26], opacity: [0.5, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
          />
        ) : null}
      </motion.g>
    </svg>
  );
}
