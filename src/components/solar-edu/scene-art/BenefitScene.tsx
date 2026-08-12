import { cn } from '@/utils/cn';
import type { BenefitArt } from '@/mocks/eduElementary';
import { Box, Building, RoofPanel, SolarPanel, Sun, Window } from './SceneParts';
import { CastShadow, SceneDefs } from './SceneDefs';
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
      <SceneDefs />

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
      <Sun cx={72} cy={54} r={26} glowClass={styles.sunGlow} rayClass={styles.sunRays} />

      {/* 해에서 판으로 끝없이 내려오는 빛 */}
      <g fill="var(--solar-deep)">
        <circle className={styles.freeDrop} r="6" />
        <circle className={styles.freeDrop} style={delay(0.7)} r="6" />
        <circle className={styles.freeDrop} style={delay(1.4)} r="6" />
      </g>

      <SolarPanel x={148} y={110} scale={0.62} glow={0.24} />

      <text x="150" y="28" fill="var(--ok-text)" fontSize="22" textAnchor="middle" fontWeight="700">0원</text>
    </g>
  );
}

/** 연기가 나지 않는다 — 굴뚝의 연기가 피어오르다 지워진다 */
function CleanArt() {
  return (
    <g>
      <CastShadow cx={58} cy={172} rx={44} ry={9} />
      <Box x={48} y={96} w={30} h={72} radius={4} dim />
      <Box x={20} y={130} w={26} h={38} radius={4} dim />

      {/*
        연기는 굴뚝 입(63, 94)에서 나온다. 굴뚝보다 먼저 그리면 벽 뒤에서 솟는 것처럼 보이므로
        굴뚝을 세운 뒤에 얹는다.
      */}
      <g fill="var(--text-faint)" fillOpacity="0.4">
        <circle className={styles.smoke} cx="63" cy="94" r="12" />
        <circle className={styles.smoke} style={delay(1.1)} cx="63" cy="94" r="12" />
        <circle className={styles.smoke} style={delay(2.2)} cx="63" cy="94" r="12" />
      </g>

      <g className={styles.cross} stroke="var(--critical)" strokeWidth="5.5" strokeLinecap="round">
        <path d="M30 86 92 132M92 86 30 132" />
      </g>

      {/* 대신 이쪽 — 조용하고 깨끗한 판 */}
      <SolarPanel x={166} y={116} scale={0.6} glow={0.2} />

      <g fill="var(--ok)">
        <path className={styles.sparkle} d="M232 88l4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" />
        <path className={styles.sparkle} style={delay(0.9)} d="M282 64l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
        <path className={styles.sparkle} style={delay(1.6)} d="M186 70l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
      </g>
    </g>
  );
}

/** 소리가 나지 않는다 — 음파가 퍼지다 잦아든다 */
function QuietArt() {
  return (
    <g>
      <SolarPanel x={94} y={116} scale={0.6} glow={0.2} />

      {/* 퍼져 나가려는 소리 — 이내 사라진다 */}
      <g stroke="var(--text-faint)" strokeWidth="4" strokeLinecap="round" fill="none">
        <path className={styles.wave} d="M186 72q14 14 0 28" />
        <path className={styles.wave} style={delay(0.5)} d="M200 58q26 28 0 56" />
        <path className={styles.wave} style={delay(1)} d="M214 44q38 42 0 84" />
      </g>

      <CastShadow cx={150} cy={106} rx={34} ry={7} />
      <circle cx="150" cy="72" r="30" fill="var(--surface)" />
      <circle cx="150" cy="72" r="30" fill="url(#edu-shine)" />
      <circle cx="150" cy="72" r="30" fill="none" stroke="var(--border-strong)" strokeWidth="2.4" />
      <path d="M138 60v24l-12-6v-12Z" fill="var(--text-faint)" />
      <path d="M144 62 162 82M162 62 144 82" stroke="var(--critical)" strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

/** 지붕만 있으면 된다 — 빈 지붕 위로 판이 내려앉는다 */
function RoofArt() {
  return (
    <g>
      <Building x={58} y={96} w={176} h={76} depth={18}>
        <Window x={18} y={14} w={24} h={22} />
        <Window x={58} y={14} w={24} h={22} />
        <Window x={98} y={14} w={24} h={22} />
        <Window x={138} y={14} w={24} h={22} />
        <Window x={18} y={46} w={24} h={22} />
        <Window x={58} y={46} w={24} h={22} />
        <Window x={98} y={46} w={24} h={22} />

        <rect x="138" y="46" width="24" height="30" rx="2" fill="var(--brand)" fillOpacity="0.42" />
        <rect x="138" y="46" width="24" height="30" rx="2" fill="url(#edu-shade)" />
        <rect x="138" y="46" width="24" height="30" rx="2" fill="none" stroke="var(--border-strong)" strokeWidth="1.6" />

        {/* 옥상 위로 내려앉는 판 석 장 */}
        {[0, 1, 2].map((slot) => (
          <RoofPanel
            key={`roof-${slot}`}
            x={7 + slot * 58}
            y={-17}
            w={52}
            d={12}
            className={styles.land}
            style={delay(slot * 0.4)}
          />
        ))}
      </Building>
    </g>
  );
}
