import { cn } from '@/utils/cn';
import type { BenefitArt } from '@/mocks/eduElementary';
import { Box, SolarPanel, Sun } from './SceneParts';
import { CastShadow, SceneDefs } from './SceneDefs';
import styles from './SceneArt.module.scss';
import type { CSSProperties, ReactNode } from 'react';

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;

/** 말풍선이 차지하는 상자 (그림 좌표계) */
const BUBBLE = { w: 250, h: 132 };

/*
  셋을 나란히 세울 자리. 그림은 저마다 300×190 좌표로 그려 여기서 줄여 놓는다.
  넷이던 것을 셋으로 줄이며(2026-09-04 회의) 남은 자리를 그림에 나눠 줘 하나하나가 커졌다.
*/
const SPOTS: { id: BenefitArt; x: number; label: string }[] = [
  { id: 'free', x: 20, label: '공짜예요' },
  { id: 'clean', x: 315, label: '깨끗해요' },
  { id: 'quiet', x: 610, label: '조용해요' },
];

const SCALE = 0.9;
const TOP = 140;

/*
  그림이 차지하는 자리.

  위쪽 140 은 말풍선 몫이라 그림이 없다. 말풍선을 쓰지 않는 쪽(한 장에 넷을 함께 세우는 판)에서
  이 좌표계를 그대로 쓰면, 빈 자리까지 함께 맞추느라 그림이 절반 크기로 줄어든다 — 재어 보니
  칸 높이의 55% 밖에 쓰지 못했다. 말풍선이 없으면 그림이 있는 곳만 잘라 보여 준다.

  6 만큼 더 여는 것은 후광과 선 끝이 경계 밖으로 조금 나가기 때문이다.
*/
const VIEW_WITH_BUBBLE = '0 0 900 330';
const VIEW_ART_ONLY = `0 ${TOP - 6} 900 ${330 - TOP + 6}`;

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
      viewBox={bubble && bubbleAt ? VIEW_WITH_BUBBLE : VIEW_ART_ONLY}
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

/** 연료가 들지 않음 — 해가 빛을 그침 없이 쏟아붓고, 판이 그것을 받는다 */
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

      {/*
        사 오지 않는 연료 — 석유통에 가위표 (2026-09-04 노트).

        「연료비 0」 이라고 글로 적어 두었었다. 셋 가운데 이 한 칸만 글이라 나머지 둘과 결이
        어긋났고, 무엇보다 읽어야 알 수 있었다. 통 하나에 가위표를 얹으면 「이것이 필요 없다」 가
        읽기 전에 잡힌다 — 매연·소리 칸이 이미 같은 기호를 쓰고 있어 셋이 한 규칙이 된다.
        선 굵기도 그 둘에 맞춘다. 혼자 굵으면 같은 기호로 읽히지 않는다.
      */}
      <g transform="translate(152 8)">
        {/* 통 — 손잡이와 주둥이가 있어야 기름통으로 읽힌다 */}
        <path d="M6 22h44a4 4 0 0 1 4 4v40a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V26a4 4 0 0 1 4-4Z" fill="var(--text-faint)" fillOpacity="0.35" />
        <path d="M18 12h20v10H18Z" fill="var(--text-faint)" fillOpacity="0.5" />
        <path d="M38 16h14l6 8" stroke="var(--text-faint)" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path
          d="M6 22h44a4 4 0 0 1 4 4v40a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V26a4 4 0 0 1 4-4Z"
          fill="none"
          stroke="var(--text-faint)"
          strokeWidth="4"
        />

        <g stroke="var(--critical)" strokeWidth="6" strokeLinecap="round">
          <path d="M2 12 58 78M58 12 2 78" />
        </g>
      </g>
    </g>
  );
}

/** 매연이 나오지 않는다 — 굴뚝의 연기가 피어오르다 지워진다 */
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
