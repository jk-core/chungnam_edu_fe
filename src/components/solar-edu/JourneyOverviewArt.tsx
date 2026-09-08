import { cn } from '@/utils/cn';
import { formatCapacity, formatNumber } from '@/utils/format';
import type { EduStats } from '@/mocks/solarEdu';
import styles from './SolarEdu.module.scss';
import type { CSSProperties } from 'react';

/** 애니메이션 시작 시각을 어긋내 여러 알갱이가 줄지어 흐르게 한다. */
const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;

/** 그림 위의 네 단계 */
export type JourneyStage = 1 | 2 | 3 | 4;

interface JourneyOverviewArtProps {
  stats: EduStats;
  /**
   * 지금 이야기하고 있는 단계. 주면 그 단계만 또렷해지고 나머지는 흐려진다.
   * 주지 않으면 넷이 나란히 보인다 — 전체가 한 줄로 이어진 것을 보여 줄 때는 그편이 맞다.
   */
  focus?: JourneyStage;
}

/**
 * 네 단계를 한 바닥 위에 늘어놓은 계통도 (SFR-005-02).
 *
 * 단계별 삽화가 "그 자리에서 무슨 일이 일어나는가" 를 보여 준다면, 이 그림은
 * "전체가 어떻게 이어지는가" 를 답한다. 지붕의 판에서 시작한 전기가 인버터를 거쳐
 * 학교에 닿기까지가 굵은 케이블 한 줄로 이어진다.
 *
 * 케이블 위에는 지금 이 순간의 값을 얹었다 — 그림이 도식이 아니라 계측 화면이 되도록.
 */
export function JourneyOverviewArt({ stats, focus }: JourneyOverviewArtProps) {
  // 도 전체를 합치면 kW 로는 배지를 넘는다 — 자릿수에 맞춰 올린다
  const output = formatCapacity(stats.outputKw);
  // 짚고 있는 단계가 아니면 뒤로 물러난다. 지우지 않고 흐리게만 두어 전체가 이어져 있음은 남긴다.
  const tone = (stage: JourneyStage) =>
    cn(styles.overviewStage, { [styles['overviewStage--dim']]: focus !== undefined && focus !== stage });

  return (
    <svg
      viewBox="0 0 380 230"
      width="100%"
      height="100%"
      fill="none"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* ── 1. 햇빛 ─────────────────────────────────────── */}
      <g className={tone(1)}>
        <circle className={styles.overviewGlow} cx="44" cy="40" r="24" fill="var(--solar)" fillOpacity="0.16" />
        <circle cx="44" cy="40" r="15" fill="var(--solar)" stroke="var(--solar-deep)" strokeWidth="1.4" />
        <g className={styles.overviewRays} stroke="var(--solar-deep)" strokeWidth="2" strokeLinecap="round">
          <path d="M44 17v5M44 58v5M21 40h5M62 40h5" />
          <path d="M28 24l3.6 3.6M56.4 52.4 60 56M28 56l3.6-3.6M56.4 27.6 60 24" />
        </g>
        <path d="M50 58 72 142" stroke="var(--solar)" strokeWidth="10" strokeOpacity="0.3" strokeLinecap="round" />
        <g fill="var(--solar-deep)">
          <circle className={styles.overviewLight} r="2.6" />
          <circle className={styles.overviewLight} style={delay(1.1)} r="2.6" />
        </g>
      </g>

      {/*
        ── 2. 태양전지 ──────────────────────────────────
        단계별 삽화의 판을 그대로 줄여 옮겼다 — 바닥에 눕힌 것이 아니라 지지대 위에 얹어
        기울여 시공한 모습이다. 판 두께와 접속함까지 같은 모양을 쓴다.
      */}
      <g className={tone(2)}>
        <path d="M100 132 185 178 100 224 15 178Z" fill="var(--ok-soft)" />
        <path d="M100 132 185 178 100 224 15 178Z" stroke="var(--ok)" strokeOpacity="0.3" strokeWidth="1.1" />

        {/* 지지대 */}
        <g stroke="var(--text-faint)" strokeWidth="2.8" strokeLinecap="round">
          <path d="M36.9 168.9v19.7M79.6 183.7v24.6M122.2 162.4v24.6" />
        </g>

        {/* 판 두께와 윗면 */}
        <path d="M32 167.3 79.6 144.3 123.8 160.7 76.3 183.7Z" fill="var(--brand-contrast)" fillOpacity="0.4" />
        <path d="M32 164 79.6 141.1 123.8 157.4 76.3 180.4Z" fill="var(--brand)" stroke="var(--brand-contrast)" strokeWidth="1.5" />

        {/* 셀 격자 */}
        <g stroke="var(--paper)" strokeOpacity="0.5" strokeWidth="1">
          <path d="M43.9 158.3 88.2 174.7M55.8 152.5 100.1 168.9M67.7 146.8 112 163.2" />
          <path d="M46.8 176.2 94.3 149.2M61.5 181.1 109.2 154.2" />
        </g>

        {/* 접속함 — 판이 만든 직류가 여기로 모인다 */}
        <path d="M114 165.6 122.2 168.9 122.2 174.6 114 171.4Z" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.1" />

        {/* 직류가 인버터로 — 방향은 케이블을 타고 흐르는 알갱이가 알려 준다 */}
        <path
          d="M122 172 176 145 176 116 196 106"
          stroke="var(--solar-deep)"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g fill="var(--solar)">
          <circle className={styles.overviewDc} r="3" />
          <circle className={styles.overviewDc} style={delay(1)} r="3" />
        </g>
        <text x="184" y="136" fill="var(--solar-deep)" fontSize="10" fontFamily="Space Grotesk, sans-serif">
          DC
        </text>
        {/* 배지는 케이블·설비를 가리지 않는 빈자리에 둔다 */}
        <Badge x={120} y={116} tone="solar" title="일사량" value={`${formatNumber(stats.irradianceNow)} W/m²`} />
      </g>

      {/* ── 3. 인버터 두 대 ─────────────────────────────── */}
      <g className={tone(3)}>
        <path d="M238 84 282 106 238 128 194 106Z" fill="var(--surface-sunken)" stroke="var(--border)" strokeWidth="1" />
        {[0, 1].map((slot) => {
          const x = 202 + slot * 26;
          const y = 110 - slot * 13;

          return (
            <g key={slot}>
              <path d={`M${x + 9} ${y - 34}L${x + 23} ${y - 27}L${x + 14} ${y - 22.5}L${x} ${y - 29.5}Z`} fill="var(--border)" stroke="var(--border-strong)" strokeWidth="1" />
              <path d={`M${x} ${y - 29.5}L${x + 14} ${y - 22.5}L${x + 14} ${y}L${x} ${y - 7}Z`} fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1" />
              <path d={`M${x + 23} ${y - 27}L${x + 14} ${y - 22.5}L${x + 14} ${y}L${x + 23} ${y - 4.5}Z`} fill="var(--surface-sunken)" stroke="var(--border-strong)" strokeWidth="1" />
              <path d={`M${x + 3} ${y - 25}L${x + 11} ${y - 21}L${x + 11} ${y - 15}L${x + 3} ${y - 19}Z`} fill="var(--brand)" />
              <circle className={styles.artBlink} cx={x + 2.5} cy={y - 13} r="1.6" fill="var(--ok)" style={delay(slot * 0.6)} />
            </g>
          );
        })}

        {/* 교류가 학교로 — 색을 바꿔 다른 전기가 되었음을 알린다 */}
        <path
          d="M262 112 262 162 284 162"
          stroke="var(--ok)"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g fill="var(--ok)">
          <circle className={styles.overviewAc} r="3" />
          <circle className={styles.overviewAc} style={delay(1)} r="3" />
        </g>
        <text x="244" y="134" fill="var(--ok-text)" fontSize="10" fontFamily="Space Grotesk, sans-serif">
          AC
        </text>
        <Badge x={302} y={116} tone="ok" title="교류 60Hz · 실시간 출력" value={`${output.value} ${output.unit}`} />
      </g>

      {/*
        ── 4. 학교 ───────────────────────────────────────
        단계별 삽화의 학교를 그대로 줄여 옮겼다 — 가로로 긴 몸통에 교실 창이 4열 2층,
        지붕에 모듈 석 장, 게양대와 현관 차양까지. 두 그림의 학교가 같아야 같은 건물로 읽힌다.
      */}
      <g className={tone(4)}>
        <path d="M297.2 144.4 333.1 162.4 321.9 168 286 150Z" fill="var(--paper)" stroke="var(--border-strong)" strokeWidth="1" />
        <path d="M286 150 321.9 168 321.9 196.5 286 178.5Z" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1" />
        <path d="M333.1 162.4 321.9 168 321.9 196.5 333.1 190.9Z" fill="var(--surface-sunken)" stroke="var(--border-strong)" strokeWidth="1" />

        {/* 옥상 난간 */}
        <path d="M298.6 145.9 330.3 161.7 320.5 166.6 288.8 150.8Z" stroke="var(--border-strong)" strokeWidth="0.8" />

        {/* 지붕 모듈 석 장 */}
        <g fill="var(--brand)" stroke="var(--brand-contrast)" strokeWidth="0.8">
          <path d="M289.3 150 298.2 154.4 305.9 150.5 297 146.1Z" />
          <path d="M301.3 156 310.1 160.4 317.9 156.5 309 152.1Z" />
          <path d="M313.2 162 322.1 166.4 329.8 162.6 320.9 158.1Z" />
        </g>

        {/* 국기 게양대 */}
        <path d="M291 151.3V133.9" stroke="var(--text-faint)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M291 135.1h6.8v4H291Z" fill="var(--brand)" stroke="var(--border-strong)" strokeWidth="0.7" />

        {/* 교실 창문 — 긴 정면 4열 2층, 짧은 옆면 1열 2층 */}
        <g fill="var(--solar)">
          <path d="M288.2 155 293.2 157.6 293.2 163.3 288.2 160.7Z" />
          <path d="M295.4 158.6 300.4 161.2 300.4 166.9 295.4 164.3Z" />
          <path d="M302.6 162.2 307.6 164.8 307.6 170.5 302.6 167.9Z" />
          <path d="M309.7 165.8 314.8 168.4 314.8 174.1 309.7 171.5Z" />
          <path d="M288.2 164.7 293.2 167.3 293.2 173 288.2 170.4Z" />
          <path d="M295.4 168.3 300.4 170.9 300.4 176.6 295.4 174Z" />
          <path d="M302.6 171.9 307.6 174.5 307.6 180.2 302.6 177.6Z" />
          <path d="M309.7 175.5 314.8 178.1 314.8 183.8 309.7 181.2Z" />
          <path d="M330.6 168.3 325 171 325 176.8 330.6 174Z" />
          <path d="M330.6 177.9 325 180.7 325 186.4 330.6 183.6Z" />
        </g>

        {/* 현관 차양과 출입구 */}
        <path d="M315.8 179.2 321.9 182.3 321.9 184.4 315.8 181.4Z" fill="var(--border-strong)" />
        <path d="M316.9 181.1 321.2 183.3 321.2 196.1 316.9 193.9Z" fill="var(--brand)" fillOpacity="0.4" stroke="var(--border-strong)" strokeWidth="0.8" />
      </g>

      {/* ── 단계 이름 ───────────────────────────────────── */}
      <g fontFamily="Pretendard Variable, sans-serif">
        <g className={tone(1)}><StageTag x={44} y={78} step="1" label="햇빛" /></g>
        <g className={tone(2)}><StageTag x={66} y={219} step="2" label="태양전지" /></g>
        <g className={tone(3)}><StageTag x={214} y={62} step="3" label="인버터" /></g>
        <g className={tone(4)}><StageTag x={306} y={216} step="4" label="학교" /></g>
      </g>
    </svg>
  );
}

interface BadgeProps {
  x: number;
  y: number;
  tone: 'solar' | 'ok';
  title: string;
  value: string;
}

/** 케이블 위 계측 배지 — 그 구간에 지금 무엇이 얼마나 흐르는지 */
function Badge({ x, y, tone, title, value }: BadgeProps) {
  const color = tone === 'solar' ? 'var(--solar-deep)' : 'var(--ok-text)';

  return (
    <g>
      <rect
        x={x - 40}
        y={y - 12}
        width="80"
        height="25"
        rx="12.5"
        fill="var(--surface)"
        stroke={color}
        strokeWidth="1.2"
      />
      <text x={x} y={y - 2} fill="var(--text-faint)" fontSize="7.5" textAnchor="middle">
        {title}
      </text>
      <text
        x={x}
        y={y + 8}
        fill={color}
        fontSize="9.5"
        textAnchor="middle"
        fontFamily="Space Grotesk, sans-serif"
      >
        {value}
      </text>
    </g>
  );
}

interface StageTagProps {
  x: number;
  y: number;
  step: string;
  label: string;
}

/** 번호와 이름 — 어느 단계를 보고 있는지 그림 위에서 바로 짚을 수 있게 한다. */
function StageTag({ x, y, step, label }: StageTagProps) {
  return (
    <g>
      <circle cx={x - 26} cy={y - 3.5} r="7" fill="var(--brand)" />
      <text
        x={x - 26}
        y={y}
        fill="var(--paper)"
        fontSize="9"
        textAnchor="middle"
        fontFamily="Space Grotesk, sans-serif"
      >
        {step}
      </text>
      <text x={x - 15} y={y} fill="var(--text)" fontSize="10.5">
        {label}
      </text>
    </g>
  );
}
