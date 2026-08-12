import { cn } from '@/utils/cn';
import type { ImpactItemId } from '@/mocks/eduElementary';
import styles from './SceneArt.module.scss';
import type { CSSProperties, ReactNode } from 'react';

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;

/** 말풍선이 차지하는 상자 (그림 좌표계) */
const BUBBLE = { w: 250, h: 132 };

/** 숲을 이루는 나무들의 자리와 크기 — 손으로 흩어 두어야 줄 세운 것처럼 보이지 않는다 */
const GROVE = [
  { x: 44, y: 250, scale: 0.5, at: 0.5 },
  { x: 104, y: 262, scale: 0.72, at: 0.15 },
  { x: 176, y: 272, scale: 0.9, at: 0 },
  { x: 250, y: 262, scale: 0.72, at: 0.3 },
  { x: 310, y: 250, scale: 0.5, at: 0.65 },
];

interface ImpactSceneProps {
  /** 지금 말풍선이 붙은 자리 — 그 덩이만 또렷해진다 */
  focus: ImpactItemId;
  bubbleAt?: { x: number; y: number };
  bubble?: ReactNode;
}

/**
 * 오늘 만든 전기로 무엇을 할 수 있나 (SFR-005-03/05/06).
 *
 * 셋을 한 화면에 함께 세운다 — 나무, 에어컨, 집. 셋이 같이 보여야 "이만큼이 이만큼이고 또 이만큼" 이
 * 한눈에 견줘진다. 다만 설명은 한 번에 하나씩만 말풍선으로 붙고, 그때 그 덩이만 또렷해진다.
 */
export function ImpactScene({ focus, bubbleAt, bubble }: ImpactSceneProps) {
  const tone = (id: ImpactItemId) => cn(styles.zone, { [styles['zone--dim']]: id !== focus });

  return (
    <svg
      className={styles.canvas}
      viewBox="0 0 900 360"
      fill="none"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      role="presentation"
    >
      <path d="M0 322h900v6H0Z" fill="var(--border-subtle)" />

      {/* ── 나무 ─────────────────────────────────────────── */}
      <g className={tone('tree')}>
        {GROVE.map((tree) => (
          <g key={tree.x} transform={`translate(${tree.x} ${tree.y}) scale(${tree.scale})`}>
            <g className={styles.grown} style={delay(tree.at)}>
              <g className={styles.sway} style={delay(tree.at * 2)}>
                <path d="M0 -104 28 -64H-28Z" fill="var(--ok)" />
                <path d="M0 -82 34 -36H-34Z" fill="var(--ok)" fillOpacity="0.88" />
                <path d="M0 -58 40 -8H-40Z" fill="var(--ok)" fillOpacity="0.76" />
              </g>
              <path d="M-7 -8h14v16H-7Z" fill="#8a6240" />
            </g>
          </g>
        ))}

        <SceneLabel x={177} y={348} label="나무를 심은 만큼" />
      </g>

      {/* ── 에어컨 ───────────────────────────────────────── */}
      <g className={tone('gadget')}>
        <rect x="392" y="196" width="116" height="46" rx="9" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="2.4" />
        <path d="M404 232h92" stroke="var(--border-strong)" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="492" cy="212" r="4" fill="var(--ok)" />

        {/* 바람은 아래로 곧게 내려온다 */}
        <g stroke="var(--ai-scan)" strokeWidth="4" strokeLinecap="round" fill="none">
          <path className={styles.breeze} d="M418 250q7 9 0 18t0 18" />
          <path className={styles.breeze} style={delay(0.4)} d="M450 250q7 9 0 18t0 18" />
          <path className={styles.breeze} style={delay(0.8)} d="M482 250q7 9 0 18t0 18" />
        </g>

        <SceneLabel x={450} y={348} label="에어컨을 켜 둘 수 있어요" />
      </g>

      {/* ── 집 ───────────────────────────────────────────── */}
      <g className={tone('house')}>
        <path d="M736 178 828 246H644Z" fill="var(--brand)" fillOpacity="0.5" stroke="var(--brand-contrast)" strokeWidth="2.4" />
        <path d="M664 246h144v76H664Z" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="2.4" />

        <g fill="var(--solar)">
          <rect className={styles.litWindow} x="686" y="262" width="30" height="26" rx="4" />
          <rect className={styles.litWindow} style={delay(1.1)} x="756" y="262" width="30" height="26" rx="4" />
          <rect className={styles.litWindow} style={delay(2.2)} x="686" y="300" width="30" height="22" rx="4" />
        </g>
        <path d="M756 300h30v22h-30Z" fill="var(--brand)" fillOpacity="0.35" stroke="var(--border-strong)" strokeWidth="1.8" />

        <SceneLabel x={736} y={348} label="한 집이 쓰는 날" />
      </g>

      {bubble && bubbleAt ? (
        <foreignObject x={bubbleAt.x} y={bubbleAt.y} width={BUBBLE.w} height={BUBBLE.h} overflow="visible">
          {bubble}
        </foreignObject>
      ) : null}
    </svg>
  );
}

/** 그림 아래 이름표 */
function SceneLabel({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <text
      x={x}
      y={y}
      fill="var(--text-muted)"
      fontSize="16"
      textAnchor="middle"
      fontFamily="Pretendard Variable, sans-serif"
    >
      {label}
    </text>
  );
}
