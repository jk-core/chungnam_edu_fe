import { cn } from '@/utils/cn';
import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import { Box, Building, SolarPanel, Sun, Window } from './SceneParts';
import { SceneDefs } from './SceneDefs';
import styles from './SceneArt.module.scss';
import type { CSSProperties, ReactNode } from 'react';

/** 애니메이션 시작 시각을 어긋내 알갱이가 줄지어 흐르게 한다. */
const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;

/** 말풍선이 차지하는 상자 (그림 좌표계) */
const BUBBLE = { w: 300, h: 156 };

interface JourneySceneProps {
  /** 지금까지 이야기한 단계. 이 번호까지의 그림이 화면에 남는다 (0부터) */
  step: number;
  nowHour: number;
  /** 지금 출력 ÷ 설비용량. 많이 만들수록 판이 환하다 */
  loadRatio: number;
  /**
   * 말풍선이 설 자리. 그림 안에 품어야 가리키는 곳이 어긋나지 않는다 —
   * 바깥에 얹으면 화면 비율에 따라 그림만 가운데로 몰려 손가락이 헛짚는다.
   */
  bubbleAt?: { x: number; y: number };
  bubble?: ReactNode;
}

/**
 * 햇빛이 전기가 되어 나무까지 가는 한 장의 그림 (SFR-005-01/05/06/07).
 *
 * 장면을 통째로 갈아 끼우면 앞에서 본 것이 사라져, 아이가 매번 새 그림을 처음부터 읽어야 한다.
 * 그래서 바닥은 하나로 두고 이야기가 나아갈 때마다 **다음 그림만 더한다** — 해가 뜨고, 판이 놓이고,
 * 인버터가 붙고, 끝에 교실에 불이 들어온다. 마지막에는 여정 전체가 한 장으로 남는다.
 *
 * 이미 나온 그림은 계속 움직인다. 아무도 조작하지 않는 화면이라 어딘가는 늘 살아 있어야 한다.
 */
export function JourneyScene({ step, nowHour, loadRatio, bubbleAt, bubble }: JourneySceneProps) {
  const progress = Math.min(1, Math.max(0, (nowHour - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR)));
  const isDay = nowHour > SUNRISE_HOUR && nowHour < SUNSET_HOUR;
  const sunX = 92 + progress * 150;
  const sunY = 108 - Math.sin(Math.PI * progress) * 56;
  const glow = 0.1 + Math.min(1, Math.max(0, loadRatio)) * 0.42;
  // 그림이 들어와야 할 차례가 됐는지. 지난 것은 계속 남는다.
  const shown = (at: number) => cn(styles.item, { [styles['item--on']]: step >= at });

  return (
    <svg
      className={styles.canvas}
      viewBox="0 0 900 360"
      fill="none"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      role="presentation"
    >
      {/* 땅 — 그림들이 놓일 바닥이라 처음부터 깔려 있다 */}
      <SceneDefs />

      <path d="M0 322h900v6H0Z" fill="var(--border-subtle)" />

      {/* ── 1. 햇빛 ─────────────────────────────────────── */}
      <g className={shown(0)}>
        {isDay ? (
          <Sun cx={sunX} cy={sunY} r={30} glowClass={styles.sunGlow} rayClass={styles.sunRays} />
        ) : (
          <text x="200" y="90" fill="var(--text-muted)" fontSize="19" textAnchor="middle">
            지금은 해가 쉬는 시간이에요
          </text>
        )}

        <SceneTag x={sunX} y={isDay ? sunY + 76 : 122} label="햇빛" />
      </g>

      {/* ── 2. 태양전지 ─────────────────────────────────── */}
      <g className={shown(1)}>
        {/* 해에서 판으로 쏟아지는 빛다발 */}
        <path
          className={styles.beam}
          d={`M${sunX - 30} ${sunY + 20}L${sunX + 30} ${sunY + 20} 296 262H120Z`}
          fill="var(--solar)"
          fillOpacity="0.2"
        />

        {/*
          떨어지는 빛 알갱이.
          해가 선 자리에서 판까지의 기울기만큼 옆으로도 흐른다 — 아침·저녁에는 비스듬히 눕고
          해가 높이 뜬 한낮에는 거의 곧게 내려온다. 입사각이 그림에서 그대로 보인다.
        */}
        <g fill="var(--solar-deep)">
          {[
            { cx: 152, at: 0 },
            { cx: 204, at: 0.5 },
            { cx: 256, at: 1 },
          ].map((drop) => (
            <circle
              key={drop.cx}
              className={styles.rain}
              cx={drop.cx}
              r="7"
              style={{ ...delay(drop.at), '--drift': `${((drop.cx - sunX) * 0.42).toFixed(1)}px` } as CSSProperties}
            />
          ))}
        </g>

        <SolarPanel x={108} y={214} glow={glow}>
          {/* 판 위를 훑고 지나는 빛 */}
          <path className={styles.sweep} d="M0 86 56 0h150l-56 86Z" fill="var(--paper)" fillOpacity="0.4" />
        </SolarPanel>

        <SceneTag x={196} y={344} label="태양전지" />
      </g>

      {/* ── 3. 인버터 ───────────────────────────────────── */}
      <g className={shown(2)}>
        {/* 판에서 인버터로 — 한 방향으로만 흐르는 직류 */}
        <path
          d="M292 292 396 292 396 268 448 268"
          stroke="var(--solar-deep)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g fill="var(--solar)">
          <circle className={styles.dc} r="6" />
          <circle className={styles.dc} style={delay(0.9)} r="6" />
        </g>
        <text x="356" y="284" fill="var(--solar-deep)" fontSize="15" fontFamily="Space Grotesk, sans-serif">
          DC
        </text>

        <Box x={448} y={214} w={96} h={96} radius={14}>
          {/* 들쭉날쭉하게 들어와 매끄럽게 나가는 모양을 창 안에 그려 둔다 */}
          <rect x="14" y="16" width="68" height="34" rx="4" fill="var(--brand)" fillOpacity="0.24" />
          <rect x="14" y="16" width="68" height="34" rx="4" fill="url(#edu-shade)" />
          <path d="M18 40 28 24 38 40 48 24" stroke="var(--solar-deep)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M52 34q7 -14 14 0t14 0" stroke="var(--ok)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <circle className={styles.blink} cx="18" cy="74" r="5" fill="var(--ok)" />
          <circle className={styles.blink} cx="36" cy="74" r="5" fill="var(--ok)" style={delay(0.7)} />
        </Box>

        <SceneTag x={496} y={344} label="인버터" />
      </g>

      {/* ── 4. 교실 ─────────────────────────────────────── */}
      <g className={shown(3)}>
        {/* 인버터에서 교실로 — 방향이 번갈아 바뀌는 교류 */}
        <path
          d="M544 262 620 262"
          stroke="var(--ok)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <g fill="var(--ok)">
          <circle className={styles.ac} r="6" />
          <circle className={styles.ac} style={delay(0.8)} r="6" />
        </g>
        <text x="566" y="246" fill="var(--ok-text)" fontSize="15" fontFamily="Space Grotesk, sans-serif">
          AC
        </text>

        <Building x={620} y={186} w={228} h={136} depth={24}>
          {/* 창문이 차례로 켜진다 — 전기가 실제로 쓰이고 있다는 뜻이다 */}
          {[0, 1, 2, 3, 4].map((slot) => (
            <Window
              key={`upper-${slot}`}
              x={20 + slot * 42}
              y={20}
              w={30}
              h={34}
              className={styles.window}
              style={delay(slot * 0.22)}
            />
          ))}
          {[0, 1, 2, 3, 4].map((slot) => (
            <Window
              key={`lower-${slot}`}
              x={20 + slot * 42}
              y={72}
              w={30}
              h={34}
              className={styles.window}
              style={delay(1.1 + slot * 0.22)}
            />
          ))}
        </Building>

        {/* 지붕에도 판이 석 장 — 이 전기가 어디서 왔는지 잊지 않게 */}
        <g>
          {[0, 1, 2].map((slot) => (
            <g key={slot} transform={`translate(${634 + slot * 70} 146) scale(0.3)`}>
              <path d="M0 86 56 0h150l-56 86Z" fill="var(--brand)" />
              <path d="M0 86 56 0h150l-56 86Z" fill="url(#edu-glass)" />
              <path d="M0 86 56 0h150l-56 86Z" fill="none" stroke="var(--brand-contrast)" strokeWidth="5" />
            </g>
          ))}
        </g>

        <SceneTag x={734} y={344} label="교실" />
      </g>

      {bubble && bubbleAt ? (
        <foreignObject x={bubbleAt.x} y={bubbleAt.y} width={BUBBLE.w} height={BUBBLE.h} overflow="visible">
          {bubble}
        </foreignObject>
      ) : null}
    </svg>
  );
}

interface SceneTagProps {
  x: number;
  y: number;
  label: string;
}

/** 그림 아래 이름표 — 지금 무엇을 보고 있는지 그림 위에서 바로 짚인다 */
function SceneTag({ x, y, label }: SceneTagProps) {
  return (
    <text
      x={x}
      y={y}
      fill="var(--text-muted)"
      fontSize="17"
      textAnchor="middle"
      fontFamily="Pretendard Variable, sans-serif"
    >
      {label}
    </text>
  );
}
