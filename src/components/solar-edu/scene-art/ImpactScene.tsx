import { cn } from '@/utils/cn';
import type { ImpactItemId } from '@/mocks/eduElementary';
import { Box, Conifer, House, Window } from './SceneParts';
import { SceneDefs } from './SceneDefs';
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
      <SceneDefs />

      <path d="M0 322h900v6H0Z" fill="var(--border-subtle)" />

      {/* ── 나무 ─────────────────────────────────────────── */}
      <g className={tone('tree')}>
        {GROVE.map((tree) => (
          <g key={tree.x} transform={`translate(${tree.x} ${tree.y}) scale(${tree.scale})`}>
            <g className={styles.grown} style={delay(tree.at)}>
              <Conifer swayClass={styles.sway} style={delay(tree.at * 2)} />
            </g>
          </g>
        ))}

        <SceneLabel x={177} y={348} label="소나무를 심은 효과" />
      </g>

      {/* ── 에어컨 ───────────────────────────────────────── */}
      <g className={tone('gadget')}>
        <Box x={392} y={192} w={116} h={48} radius={16}>
          {/* 위쪽 흡입 그릴 */}
          <rect x="14" y="11" width="76" height="12" rx="6" fill="var(--surface-sunken)" />
          <g stroke="var(--border-strong)" strokeOpacity="0.35" strokeWidth="1.2">
            <path d="M22 17h60" />
          </g>

          {/* 아래쪽 토출구 — 바람이 나오는 긴 홈 */}
          <rect x="10" y="32" width="96" height="9" rx="4.5" fill="var(--surface-sunken)" />
          <rect x="10" y="32" width="96" height="9" rx="4.5" fill="url(#edu-shade)" />
          <path d="M14 36.5h88" stroke="var(--border-strong)" strokeOpacity="0.45" strokeWidth="1.4" strokeLinecap="round" />

          {/* 켜져 있다는 표시등 */}
          <circle cx="100" cy="17" r="4" fill="var(--ok)" />
          <circle cx="100" cy="17" r="4" fill="url(#edu-shine)" />
        </Box>

        {/* 바람은 아래로 곧게 내려온다 */}
        <g stroke="var(--ai-scan)" strokeWidth="4" strokeLinecap="round" fill="none">
          <path className={styles.breeze} d="M418 248q7 9 0 18t0 18" />
          <path className={styles.breeze} style={delay(0.4)} d="M450 248q7 9 0 18t0 18" />
          <path className={styles.breeze} style={delay(0.8)} d="M482 248q7 9 0 18t0 18" />
        </g>

        <SceneLabel x={450} y={348} label="에어컨 가동 시간" />
      </g>

      {/* ── 집 ───────────────────────────────────────────── */}
      <g className={tone('house')}>
        <House x={662} y={240} w={148} h={82}>
          {/* 창은 십자 창틀을 둬야 유리 한 장이 아니라 창으로 읽힌다 */}
          <PaneWindow x={22} y={16} className={styles.litWindow} />
          <PaneWindow x={92} y={16} className={styles.litWindow} style={delay(1.1)} />
          <PaneWindow x={22} y={52} className={styles.litWindow} style={delay(2.2)} />

          {/* 현관 — 손잡이 하나로 문이 된다 */}
          <rect x="92" y="52" width="34" height="30" rx="3" fill="var(--brand)" fillOpacity="0.45" />
          <rect x="92" y="52" width="34" height="30" rx="3" fill="url(#edu-shine)" />
          <rect x="92" y="52" width="34" height="30" rx="3" fill="none" stroke="var(--brand-contrast)" strokeWidth="1.8" />
          <circle cx="120" cy="68" r="2.6" fill="var(--solar)" />
        </House>

        <SceneLabel x={736} y={348} label="4인 가족이 쓸 수 있는 날" />
      </g>

      {bubble && bubbleAt ? (
        <foreignObject x={bubbleAt.x} y={bubbleAt.y} width={BUBBLE.w} height={BUBBLE.h} overflow="visible">
          {bubble}
        </foreignObject>
      ) : null}
    </svg>
  );
}

/** 십자 창틀을 가진 창 — 유리 한 장보다 집 창문답다 */
function PaneWindow({ x, y, className, style }: { x: number; y: number; className?: string; style?: CSSProperties }) {
  return (
    <g className={className} style={style}>
      <Window x={x} y={y} w={34} h={30} />
      <g stroke="var(--solar-deep)" strokeOpacity="0.4" strokeWidth="1.4">
        <path d={`M${x + 17} ${y}v30M${x} ${y + 15}h34`} />
      </g>
    </g>
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
