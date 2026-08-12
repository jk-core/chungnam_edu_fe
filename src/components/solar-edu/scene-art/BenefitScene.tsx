import { cn } from '@/utils/cn';
import type { BenefitArt } from '@/mocks/eduElementary';
import styles from './SceneArt.module.scss';
import type { CSSProperties, ReactNode } from 'react';

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;

/** 말풍선이 차지하는 상자 (그림 좌표계) */
const BUBBLE = { w: 250, h: 132 };

/** 넷을 나란히 세울 자리. 그림은 저마다 300×190 좌표로 그려 여기서 줄여 놓는다 */
const SPOTS: { id: BenefitArt; x: number; label: string }[] = [
  { id: 'free', x: 6, label: '햇빛은 공짜' },
  { id: 'clean', x: 232, label: '연기 없음' },
  { id: 'quiet', x: 458, label: '소리 없음' },
  { id: 'roof', x: 678, label: '지붕이면 충분' },
];

const SCALE = 0.72;
const TOP = 140;

interface BenefitSceneProps {
  /** 지금 말풍선이 붙은 자리 — 그 덩이만 또렷해진다 */
  focus: BenefitArt;
  bubbleAt?: { x: number; y: number };
  bubble?: ReactNode;
}

/**
 * 태양광의 좋은 점 넷 (SFR-005-02).
 *
 * 넷을 한 화면에 함께 세운다 — 좋은 점은 서로 견줄 때 더 또렷해지기 때문이다.
 * 설명은 한 번에 하나씩만 말풍선으로 붙고, 그때 그 덩이만 또렷해진다.
 *
 * 좋은 점은 대개 "없는 것" 이라(연료비가 없고, 연기가 없고, 소리가 없고) 글로만 적으면 와닿지 않는다.
 * 그래서 그림에서는 있던 것이 사라지거나 가로막히는 모습으로 보인다.
 */
export function BenefitScene({ focus, bubbleAt, bubble }: BenefitSceneProps) {
  return (
    <svg
      className={styles.canvas}
      viewBox="0 0 900 330"
      fill="none"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      role="presentation"
    >
      <path d="M0 296h900v5H0Z" fill="var(--border-subtle)" />

      {SPOTS.map((spot) => (
        <g key={spot.id} className={cn(styles.zone, { [styles['zone--dim']]: spot.id !== focus })}>
          <g transform={`translate(${spot.x} ${TOP}) scale(${SCALE})`}>
            {spot.id === 'free' ? <FreeArt /> : null}
            {spot.id === 'clean' ? <CleanArt /> : null}
            {spot.id === 'quiet' ? <QuietArt /> : null}
            {spot.id === 'roof' ? <RoofArt /> : null}
          </g>

          <text
            x={spot.x + (300 * SCALE) / 2}
            y="320"
            fill="var(--text-muted)"
            fontSize="17"
            textAnchor="middle"
            fontFamily="Pretendard Variable, sans-serif"
          >
            {spot.label}
          </text>
        </g>
      ))}

      {bubble && bubbleAt ? (
        <foreignObject x={bubbleAt.x} y={bubbleAt.y} width={BUBBLE.w} height={BUBBLE.h} overflow="visible">
          {bubble}
        </foreignObject>
      ) : null}
    </svg>
  );
}

/** 햇빛은 공짜 — 해가 빛을 그침 없이 쏟아붓고, 판이 그것을 받는다 */
function FreeArt() {
  return (
    <g>
      <circle className={styles.sunGlow} cx="78" cy="56" r="46" fill="var(--solar)" fillOpacity="0.2" />
      <circle cx="78" cy="56" r="28" fill="var(--solar)" stroke="var(--solar-deep)" strokeWidth="2.4" />
      <g className={styles.sunRays} style={{ transformOrigin: '78px 56px' }} stroke="var(--solar-deep)" strokeWidth="3.4" strokeLinecap="round">
        <path d="M78 12v9M78 91v9M34 56h9M113 56h9" />
        <path d="M47 25l6 6M103 81l6 6M47 87l6-6M103 31l6-6" />
      </g>

      <g fill="var(--solar-deep)">
        <circle className={styles.freeDrop} r="6" />
        <circle className={styles.freeDrop} style={delay(0.7)} r="6" />
        <circle className={styles.freeDrop} style={delay(1.4)} r="6" />
      </g>

      <path d="M150 168 186 116h108l-36 52Z" fill="var(--brand)" stroke="var(--brand-contrast)" strokeWidth="2.4" />
      <g stroke="var(--paper)" strokeOpacity="0.5" strokeWidth="1.6">
        <path d="M174 133h108M162 150h108" />
      </g>
      <g stroke="var(--text-faint)" strokeWidth="5" strokeLinecap="round">
        <path d="M180 168v14M258 168v14" />
      </g>

      <text x="150" y="30" fill="var(--ok-text)" fontSize="22" textAnchor="middle" fontWeight="700">0원</text>
    </g>
  );
}

/** 연기가 나지 않는다 — 굴뚝의 연기가 피어오르다 지워진다 */
function CleanArt() {
  return (
    <g>
      <g fill="var(--text-faint)" fillOpacity="0.45">
        <circle className={styles.smoke} cx="66" cy="96" r="13" />
        <circle className={styles.smoke} style={delay(1)} cx="66" cy="96" r="13" />
        <circle className={styles.smoke} style={delay(2)} cx="66" cy="96" r="13" />
      </g>
      <path d="M52 168V96h28v72Z" fill="var(--text-faint)" fillOpacity="0.35" stroke="var(--border-strong)" strokeWidth="2.4" />
      <path d="M30 168v-38h22v38Z" fill="var(--text-faint)" fillOpacity="0.22" stroke="var(--border-strong)" strokeWidth="2.4" />

      <g className={styles.cross} stroke="var(--critical)" strokeWidth="5" strokeLinecap="round">
        <path d="M36 84 88 128M88 84 36 128" />
      </g>

      <path d="M168 168 200 122h96l-32 46Z" fill="var(--brand)" stroke="var(--brand-contrast)" strokeWidth="2.4" />
      <g stroke="var(--paper)" strokeOpacity="0.5" strokeWidth="1.6">
        <path d="M190 137h96M179 152h96" />
      </g>
      <g fill="var(--ok)">
        <path className={styles.sparkle} d="M232 92l4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" />
        <path className={styles.sparkle} style={delay(0.9)} d="M282 68l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
        <path className={styles.sparkle} style={delay(1.6)} d="M186 74l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
      </g>
    </g>
  );
}

/** 소리가 나지 않는다 — 음파가 퍼지다 잦아든다 */
function QuietArt() {
  return (
    <g>
      <path d="M96 168 128 122h96l-32 46Z" fill="var(--brand)" stroke="var(--brand-contrast)" strokeWidth="2.4" />
      <g stroke="var(--paper)" strokeOpacity="0.5" strokeWidth="1.6">
        <path d="M118 137h96M107 152h96" />
      </g>
      <g stroke="var(--text-faint)" strokeWidth="5" strokeLinecap="round">
        <path d="M126 168v14M204 168v14" />
      </g>

      <g stroke="var(--text-faint)" strokeWidth="4" strokeLinecap="round" fill="none">
        <path className={styles.wave} d="M186 74q14 14 0 28" />
        <path className={styles.wave} style={delay(0.5)} d="M200 60q26 28 0 56" />
        <path className={styles.wave} style={delay(1)} d="M214 46q38 42 0 84" />
      </g>

      <circle cx="150" cy="74" r="30" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="2.4" />
      <path d="M138 62v24l-12-6v-12Z" fill="var(--text-faint)" />
      <path d="M144 64 162 84M162 64 144 84" stroke="var(--critical)" strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

/** 지붕만 있으면 된다 — 빈 지붕 위로 판이 내려앉는다 */
function RoofArt() {
  return (
    <g>
      <path d="M60 172V96h180v76Z" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="2.4" />
      <path d="M50 96h200v-12H50Z" fill="var(--surface-sunken)" stroke="var(--border-strong)" strokeWidth="2" />

      <g fill="var(--solar)" fillOpacity="0.65">
        <rect x="76" y="110" width="24" height="22" rx="3" />
        <rect x="116" y="110" width="24" height="22" rx="3" />
        <rect x="156" y="110" width="24" height="22" rx="3" />
        <rect x="196" y="110" width="24" height="22" rx="3" />
        <rect x="76" y="142" width="24" height="22" rx="3" />
        <rect x="116" y="142" width="24" height="22" rx="3" />
        <rect x="156" y="142" width="24" height="22" rx="3" />
      </g>
      <path d="M196 142h24v30h-24Z" fill="var(--brand)" fillOpacity="0.35" stroke="var(--border-strong)" strokeWidth="1.6" />

      <g fill="var(--brand)" stroke="var(--brand-contrast)" strokeWidth="1.8">
        <path className={styles.land} d="M74 82 96 54h44l-22 28Z" />
        <path className={styles.land} style={delay(0.4)} d="M136 82 158 54h44l-22 28Z" />
        <path className={styles.land} style={delay(0.8)} d="M198 82 220 54h44l-22 28Z" />
      </g>
    </g>
  );
}
