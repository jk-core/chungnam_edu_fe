import { cn } from '@/utils/cn';
import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import styles from './SceneArt.module.scss';
import type { CSSProperties } from 'react';

/** 애니메이션 시작 시각을 어긋내 알갱이가 줄지어 흐르게 한다. */
const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;

interface JourneySceneProps {
  /** 지금까지 이야기한 단계. 이 번호까지의 그림이 화면에 남는다 (0부터) */
  step: number;
  nowHour: number;
  /** 지금 출력 ÷ 설비용량. 많이 만들수록 판이 환하다 */
  loadRatio: number;
  /** 나무가 자란 정도 0~4 */
  growth: number;
}

/**
 * 햇빛이 전기가 되어 나무까지 가는 한 장의 그림 (SFR-005-01/05/06/07).
 *
 * 장면을 통째로 갈아 끼우면 앞에서 본 것이 사라져, 아이가 매번 새 그림을 처음부터 읽어야 한다.
 * 그래서 바닥은 하나로 두고 이야기가 나아갈 때마다 **다음 그림만 더한다** — 해가 뜨고, 판이 놓이고,
 * 인버터가 붙고, 교실에 불이 들어오고, 끝에 나무가 자란다. 마지막에는 여정 전체가 한 장으로 남는다.
 *
 * 이미 나온 그림은 계속 움직인다. 아무도 조작하지 않는 화면이라 어딘가는 늘 살아 있어야 한다.
 */
export function JourneyScene({ step, nowHour, loadRatio, growth }: JourneySceneProps) {
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
      viewBox="0 0 1120 360"
      fill="none"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* 땅 — 그림들이 놓일 바닥이라 처음부터 깔려 있다 */}
      <path d="M0 322h1120v6H0Z" fill="var(--border-subtle)" />

      {/* ── 1. 햇빛 ─────────────────────────────────────── */}
      <g className={shown(0)}>
        <path
          d="M92 108A150 150 0 0 1 392 108"
          stroke="var(--border-strong)"
          strokeWidth="1.6"
          strokeDasharray="4 8"
          strokeLinecap="round"
        />

        {isDay ? (
          <g>
            <circle className={styles.sunGlow} cx={sunX} cy={sunY} r="52" fill="var(--solar)" fillOpacity="0.22" />
            <circle cx={sunX} cy={sunY} r="30" fill="var(--solar)" stroke="var(--solar-deep)" strokeWidth="2.4" />
            <g
              className={styles.sunRays}
              style={{ transformOrigin: `${sunX}px ${sunY}px` }}
              stroke="var(--solar-deep)"
              strokeWidth="3.4"
              strokeLinecap="round"
            >
              <path d={`M${sunX} ${sunY - 46}v9M${sunX} ${sunY + 37}v9M${sunX - 46} ${sunY}h9M${sunX + 37} ${sunY}h9`} />
              <path
                d={`M${sunX - 33} ${sunY - 33}l7 7M${sunX + 26} ${sunY + 26}l7 7M${sunX - 33} ${sunY + 33}l7-7M${sunX + 26} ${sunY - 26}l7-7`}
              />
            </g>
          </g>
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
          d={`M${sunX - 26} ${sunY + 18}L120 262h176Z`}
          fill="var(--solar)"
          fillOpacity="0.2"
        />

        {/* 떨어지는 빛 알갱이 */}
        <g fill="var(--solar-deep)">
          <circle className={styles.rain} cx="152" r="7" style={delay(0)} />
          <circle className={styles.rain} cx="204" r="7" style={delay(0.5)} />
          <circle className={styles.rain} cx="256" r="7" style={delay(1)} />
        </g>

        <path d="M108 300 164 214h150l-56 86Z" fill="var(--brand)" stroke="var(--brand-contrast)" strokeWidth="2.4" />
        <path d="M108 300 164 214h150l-56 86Z" fill="var(--solar)" fillOpacity={glow} />
        <g stroke="var(--paper)" strokeOpacity="0.5" strokeWidth="1.6">
          <path d="M150 235h150M136 257h150M122 279h150" />
        </g>
        <path className={styles.sweep} d="M108 300 164 214h150l-56 86Z" fill="var(--paper)" fillOpacity="0.45" />
        <g stroke="var(--text-faint)" strokeWidth="5" strokeLinecap="round">
          <path d="M148 300v22M268 300v22" />
        </g>

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

        <path d="M448 214h96v96h-96Z" rx="8" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="2.4" />
        <path d="M462 230h68v34h-68Z" fill="var(--brand)" fillOpacity="0.28" />
        {/* 들쭉날쭉하게 들어와 매끄럽게 나가는 모양을 창 안에 그려 둔다 */}
        <path d="M466 254 476 238 486 254 496 238" stroke="var(--solar-deep)" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M500 248q7 -14 14 0t14 0" stroke="var(--ok)" strokeWidth="2.4" strokeLinecap="round" />
        <circle className={styles.blink} cx="466" cy="288" r="5" fill="var(--ok)" />
        <circle className={styles.blink} cx="484" cy="288" r="5" fill="var(--ok)" style={delay(0.7)} />

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

        <path d="M620 322V186h228v136Z" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="2.4" />
        <path d="M606 186h256v-16H606Z" fill="var(--surface-sunken)" stroke="var(--border-strong)" strokeWidth="2" />

        {/* 지붕에도 판이 석 장 — 이 전기가 어디서 왔는지 잊지 않게 */}
        <g fill="var(--brand)" stroke="var(--brand-contrast)" strokeWidth="1.6">
          <path d="M634 168 654 146h44l-20 22Z" />
          <path d="M704 168 724 146h44l-20 22Z" />
          <path d="M774 168 794 146h44l-20 22Z" />
        </g>

        {/* 창문이 차례로 켜진다 — 전기가 실제로 쓰이고 있다는 뜻이다 */}
        <g fill="var(--solar)">
          {[0, 1, 2, 3, 4].map((slot) => (
            <rect
              key={`upper-${slot}`}
              className={styles.window}
              style={delay(slot * 0.22)}
              x={640 + slot * 42}
              y={206}
              width="30"
              height="34"
              rx="3"
            />
          ))}
          {[0, 1, 2, 3, 4].map((slot) => (
            <rect
              key={`lower-${slot}`}
              className={styles.window}
              style={delay(1.1 + slot * 0.22)}
              x={640 + slot * 42}
              y={258}
              width="30"
              height="34"
              rx="3"
            />
          ))}
        </g>
        <path d="M812 268h24v54h-24Z" fill="var(--brand)" fillOpacity="0.32" stroke="var(--border-strong)" strokeWidth="1.6" />

        <SceneTag x={734} y={344} label="교실" />
      </g>

      {/* ── 5. 나무 ─────────────────────────────────────── */}
      <g className={shown(4)}>
        <path d="M968 322v-58h14v58Z" fill="var(--tree-trunk, #8a6240)" />
        <g className={styles.leaves}>
          <circle cx="975" cy="252" r="42" fill="var(--ok)" fillOpacity={growth >= 1 ? 0.9 : 0.18} />
          <circle cx="1018" cy="230" r="32" fill="var(--ok)" fillOpacity={growth >= 2 ? 0.85 : 0.18} />
          <circle cx="934" cy="230" r="32" fill="var(--ok)" fillOpacity={growth >= 3 ? 0.85 : 0.18} />
          <circle cx="978" cy="196" r="30" fill="var(--ok)" fillOpacity={growth >= 4 ? 0.8 : 0.18} />
        </g>

        <SceneTag x={975} y={344} label="깨끗해진 공기" />
      </g>
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
