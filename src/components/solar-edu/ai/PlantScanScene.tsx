import { cn } from '@/utils/cn';
import { PLANT_SPOT_LABEL } from '@/mocks/eduContent';
import type { PlantSpot } from '@/mocks/eduContent';
import styles from './AiParts.module.scss';
import type { CSSProperties } from 'react';

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;

/**
 * 그림에서 각 자리가 차지하는 상자.
 * 겨냥 표시를 그리는 데도, 그 자리를 확대해 들여다보는 데도 이 크기가 필요하다.
 */
const SPOTS: Record<PlantSpot, { x: number; y: number; w: number; h: number; label: string }> = {
  cell: { x: 12, y: 74, w: 112, h: 84, label: PLANT_SPOT_LABEL.cell },
  module: { x: 144, y: 106, w: 124, h: 66, label: PLANT_SPOT_LABEL.module },
  inverter: { x: 286, y: 102, w: 92, h: 78, label: PLANT_SPOT_LABEL.inverter },
  grid: { x: 396, y: 98, w: 108, h: 82, label: PLANT_SPOT_LABEL.grid },
};

/*
  들여다볼 때의 배율.

  네 자리를 한 화면에 늘어놓으면 각자 120px 남짓이라 셀의 층 이름이나 인버터 안의 파형이 뭉개진다.
  AI 가 한 자리를 살펴보는 동안 그 자리를 실제로 당겨 보면, "들여다본다" 는 말이 화면에서도 일어난다.
  이웃한 자리가 화면 가장자리에 걸쳐 남을 만큼만 당겨 전체 흐름은 놓치지 않는다.
*/
const ZOOM = 1.75;
const STAGE = { w: 520, h: 200 };

/** 읽는 선이 끌고 오는 꼬리의 길이 */
const SCAN_TRAIL = 26;

interface PlantScanSceneProps {
  /** 지금 들여다보는 자리 */
  focus: PlantSpot;
}

/**
 * AI 가 들여다보는 설비 한 벌 (SFR-005-02).
 *
 * 격자와 막대만으로는 AI 가 부지런히 무언가를 한다는 것까지만 보인다. 무엇을 보는지가 보이려면
 * 볼 대상이 화면에 있어야 한다. 그래서 태양전지 셀에서 학교까지를 한 장에 늘어놓고,
 * 단계가 넘어갈 때마다 AI 의 시선이 그중 한 자리로 옮겨 가게 했다.
 *
 * 왼쪽부터 오른쪽으로 전기가 만들어져 흘러가는 순서다 — 그림 자체가 발전 원리의 차례이기도 하다.
 */
export function PlantScanScene({ focus }: PlantScanSceneProps) {
  const box = SPOTS[focus];
  const tone = (spot: PlantSpot) => cn(styles.zone, { [styles['zone--dim']]: spot !== focus });
  // 자리의 한가운데를 화면 한가운데로 끌어온 뒤 그만큼 키운다.
  const shift = {
    x: STAGE.w / 2 - ZOOM * (box.x + box.w / 2),
    y: STAGE.h / 2 - ZOOM * (box.y + box.h / 2),
  };

  return (
    <svg
      className={styles.plant}
      viewBox="0 0 520 200"
      fill="none"
      role="img"
      aria-label={`설비 그림 — 지금 ${box.label} 를 살펴보는 중`}
    >
      <defs>
        {/* 읽는 선이 끌고 오는 꼬리 — 지나온 쪽일수록 옅어진다 */}
        <linearGradient id="plant-scan-trail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--ai-scan)" stopOpacity="0" />
          <stop offset="0.72" stopColor="var(--ai-scan)" stopOpacity="0.14" />
          <stop offset="1" stopColor="var(--ai-scan)" stopOpacity="0.34" />
        </linearGradient>
      </defs>
      <g
        className={styles.stage}
        style={{ transform: `translate(${shift.x.toFixed(1)}px, ${shift.y.toFixed(1)}px) scale(${ZOOM})` }}
      >
        {/* 전기가 지나는 길. 자리와 자리를 잇는 굵은 선이 순서를 만든다 */}
        <path d="M118 150H150M256 150H292M372 150H408" stroke="var(--border-strong)" strokeWidth="2.5" strokeLinecap="round" />

        {/* ── 1. 태양전지 셀 — 전기가 태어나는 자리 ────────────── */}
        <g className={tone('cell')}>
          {/* 비스듬히 떨어지는 빛 알갱이 */}
          <g fill="var(--solar)">
            <circle className={styles.photon} r="4.5" />
            <circle className={styles.photon} style={delay(0.8)} r="4.5" />
            <circle className={styles.photon} style={delay(1.6)} r="4.5" />
          </g>

          {/* 위 전극 */}
          <path d="M24 86h88" stroke="var(--text-faint)" strokeWidth="3" strokeLinecap="round" />

          {/* n 층 · 접합면 · p 층 — 접합이 전자를 한 방향으로 몬다 */}
          <path d="M24 90h88v22H24Z" fill="var(--ai-scan)" fillOpacity="0.22" />
          <path d="M24 112h88v3H24Z" fill="var(--ai-reason)" fillOpacity="0.7" />
          <path d="M24 115h88v24H24Z" fill="var(--brand)" fillOpacity="0.3" />
          <path d="M24 90h88v49H24Z" stroke="var(--border-strong)" strokeWidth="1.2" />

          <text x="68" y="105" fill="var(--text-muted)" fontSize="10" textAnchor="middle">n형</text>
          <text x="68" y="132" fill="var(--text-muted)" fontSize="10" textAnchor="middle">p형</text>

          {/* 접합에서 튀어 올라 전극으로 가는 전자 */}
          <g fill="var(--ai-classify)">
            <circle className={styles.electron} r="4" />
            <circle className={styles.electron} style={delay(0.9)} r="4" />
          </g>

          {/* 아래 전극과 바깥으로 나가는 전선 */}
          <path d="M24 143h88" stroke="var(--text-faint)" strokeWidth="3" strokeLinecap="round" />
          <path d="M112 143v7h6" stroke="var(--text-faint)" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* ── 2. 모듈과 스트링 — 여러 장을 한 줄로 잇는다 ──────── */}
        <g className={tone('module')}>
          <path d="M150 150 168 116h96l-18 34Z" fill="var(--surface-sunken)" stroke="var(--border-strong)" strokeWidth="1.2" />

          {[0, 1, 2].map((slot) => (
            <g key={slot}>
              <path
                d={`M${160 + slot * 32} 142 ${172 + slot * 32} 120h24l-12 22Z`}
                fill="var(--brand)"
                stroke="var(--brand-contrast)"
                strokeWidth="1.2"
              />
              <path
                d={`M${166 + slot * 32} 131h24`}
                stroke="var(--paper)"
                strokeOpacity="0.5"
                strokeWidth="1"
              />
            </g>
          ))}

          {/* 한 줄로 이었다는 것 — 직렬이라 한 장이 그늘지면 줄 전체가 준다 */}
          <path
            className={styles.string}
            d="M164 146h96"
            stroke="var(--ai-scan)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="5 5"
          />
          <text x="208" y="163" fill="var(--text-muted)" fontSize="10" textAnchor="middle">직렬 연결</text>
        </g>

        {/* ── 3. 인버터 — 직류를 교류로 ────────────────────────── */}
        <g className={tone('inverter')}>
          <rect x="292" y="112" width="72" height="60" rx="6" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.6" />
          <rect x="300" y="120" width="56" height="26" rx="3" fill="var(--surface-sunken)" />

          {/* 들쭉날쭉하게 들어와 매끈하게 나가는 모양 */}
          <path d="M304 140 312 126 320 140" stroke="var(--solar-deep)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M330 133q6 -11 12 0t12 0" stroke="var(--ok)" strokeWidth="2" strokeLinecap="round" fill="none" />

          <circle className={styles.blink} cx="304" cy="160" r="3.6" fill="var(--ok)" />
          <circle className={styles.blink} style={delay(0.7)} cx="316" cy="160" r="3.6" fill="var(--ok)" />

          <text x="272" y="144" fill="var(--solar-deep)" fontSize="10" textAnchor="middle" fontFamily="Space Grotesk, sans-serif">DC</text>
          <text x="390" y="144" fill="var(--ok-text)" fontSize="10" textAnchor="middle" fontFamily="Space Grotesk, sans-serif">AC</text>
        </g>

        {/* ── 4. 학교 — 만든 전기가 그대로 쓰인다 ───────────────── */}
        <g className={tone('grid')}>
          <path d="M408 172V118h64v54Z" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.6" />
          <path d="M402 118h76v-9h-76Z" fill="var(--surface-sunken)" stroke="var(--border-strong)" strokeWidth="1.2" />

          <g fill="var(--solar)" fillOpacity="0.7">
            {[0, 1, 2].map((slot) => (
              <rect key={`u${slot}`} className={styles.window} style={delay(slot * 0.25)} x={415 + slot * 18} y={126} width={12} height={14} rx="2" />
            ))}
            {[0, 1, 2].map((slot) => (
              <rect key={`l${slot}`} className={styles.window} style={delay(0.9 + slot * 0.25)} x={415 + slot * 18} y={148} width={12} height={14} rx="2" />
            ))}
          </g>
        </g>

        <path d="M6 178h508" stroke="var(--border-subtle)" strokeWidth="1.6" />

        {/*
        겨냥 표시. 자리가 바뀌면 상자가 미끄러지듯 옮겨 가고, 그 안을 빛줄기가 훑는다 —
        AI 의 시선이 옮겨 가는 것을 상자 하나가 대신 말해 준다.
      */}
        <g className={styles.aim} style={{ '--x': `${box.x}px`, '--y': `${box.y}px` } as CSSProperties}>
          <rect
            className={styles.aim__box}
            x="0"
            y="0"
            width={box.w}
            height={box.h}
            rx="6"
          />
          {[
            'M0 14V4a4 4 0 0 1 4-4h10',
            `M${box.w - 14} 0h10a4 4 0 0 1 4 4v10`,
            `M${box.w} ${box.h - 14}v10a4 4 0 0 1-4 4h-10`,
            `M14 ${box.h}H4a4 4 0 0 1-4-4v-10`,
          ].map((d) => (
            <path key={d} className={styles.aim__corner} d={d} />
          ))}
          {/*
            상자 안을 훑는 빛.

            납작한 반투명 띠 하나로는 무언가가 지나간다는 것만 보이지, 어디를 읽는 중인지는 안 보인다.
            읽는 선(밝은 한 줄)과 지나온 자리(옅어지며 사라지는 꼬리)를 갈라 놓으면 그 둘이 함께 읽힌다.
            꼬리가 상자 밖으로 새지 않도록 상자 모양대로 오려 낸다.
          */}
          <clipPath id="plant-aim-clip">
            <rect x="1" y="1" width={box.w - 2} height={box.h - 2} rx="5" />
          </clipPath>

          <g clipPath="url(#plant-aim-clip)">
            <g
              className={styles.aim__scan}
              style={{ '--scan-h': `${box.h}px` } as CSSProperties}
            >
              <rect x="1" y={-SCAN_TRAIL} width={box.w - 2} height={SCAN_TRAIL} fill="url(#plant-scan-trail)" />
              <path
                className={styles.aim__edge}
                d={`M1 0h${box.w - 2}`}
              />
            </g>
          </g>
        </g>

        <text
          className={styles.aim__label}
          x={box.x + box.w / 2}
          y={box.y - 7}
          textAnchor="middle"
          fontSize="10"
        >
          {box.label}
        </text>
      </g>
    </svg>
  );
}
