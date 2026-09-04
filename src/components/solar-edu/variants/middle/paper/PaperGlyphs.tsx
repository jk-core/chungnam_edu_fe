import type { ChapterId, ScaleId, StepId } from '@/mocks/eduPaper';
import styles from './PaperGlyphs.module.scss';
import type { ReactElement } from 'react';

/**
 * 시안 E 의 그림 조각 (SFR-005-06).
 *
 * 두 겹으로 그린다 — 아래에 형태를 채운 면을 옅게 깔고 그 위에 또렷한 선을 얹는다.
 * 선 하나만으로는 아이콘이 도면처럼 메마르고, 면만 쓰면 이 판의 활자와 결이 어긋난다.
 *
 * 채우는 면은 **그리는 선과 같은 자리**를 쓴다. 처음에는 대충 닮은 도형을 깔았는데, 벽보다
 * 넓은 면이 지붕 아래로 삐져나오고 바닥선이 차체보다 길게 뻗는 일이 생겼다 (2026-09-01).
 * 그래서 형태마다 경로를 상수로 한 번만 적고 면과 선이 그것을 나눠 쓴다.
 *
 * 색은 `currentColor` 로 물려받고 아래 면은 그 색을 옅게 깐다.
 */

/** 그림 하나를 두 겹으로 세운다 — 아래 면, 위 선 */
function Glyph({ fill, children }: { fill?: string; children: ReactElement }) {
  return (
    <svg className={styles.glyph} viewBox="0 0 32 32" role="presentation" aria-hidden="true">
      {fill && <path className={styles.soft} d={fill} />}
      <g className={styles.line}>{children}</g>
    </svg>
  );
}

// ── 2장 · 네 걸음 ─────────────────────────────────────────
/** 해에서 뻗는 빛살. 여덟 갈래를 45도마다 둔다. */
const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

const RAYS = RAY_ANGLES.map((degree) => {
  const radian = (degree * Math.PI) / 180;
  const from = [16 + Math.cos(radian) * 10, 16 + Math.sin(radian) * 10];
  const to = [16 + Math.cos(radian) * 13.6, 16 + Math.sin(radian) * 13.6];

  return `M${from[0].toFixed(1)} ${from[1].toFixed(1)}L${to[0].toFixed(1)} ${to[1].toFixed(1)}`;
}).join('');

/** 지붕에 얹힌 판. 위가 좁고 아래가 넓어 비스듬히 놓인 것으로 읽힌다 */
const PANEL = 'M6 21.5L11.2 10H26L22.8 21.5Z';

function SunGlyph() {
  return (
    <Glyph fill="M16 9a7 7 0 110 14 7 7 0 010-14z">
      <>
        <circle cx="16" cy="16" r="7" />
        <path d={RAYS} />
      </>
    </Glyph>
  );
}

function CellGlyph() {
  return (
    <Glyph fill={PANEL}>
      <>
        <path d={PANEL} />
        {/* 셀을 가르는 격자. 판의 두 변과 나란해야 비스듬한 면으로 보인다 */}
        <path d="M14.9 10L10.2 21.5M18.6 10L14.4 21.5M22.3 10L18.6 21.5" />
        <path d="M8.6 15.8H24.4" />
        {/* 판을 떠받치는 기둥 */}
        <path d="M14.4 21.5V26M10.4 26H18.4" />
      </>
    </Glyph>
  );
}

/*
  인버터.

  네모 안에 가로줄만 그으면 메모장이 된다 — 기기로 읽히려면 표시창과 상태등, 세로로 선
  방열 슬릿, 그리고 아래로 빠지는 케이블이 있어야 한다.
*/
function InverterGlyph() {
  return (
    <Glyph fill="M9.9 4.6h12.2a2.4 2.4 0 012.4 2.4v14.6a2.4 2.4 0 01-2.4 2.4H9.9a2.4 2.4 0 01-2.4-2.4V7a2.4 2.4 0 012.4-2.4z">
      <>
        <rect x="7.5" y="4.6" width="17" height="19.4" rx="2.4" />
        {/* 표시창 — 안에서 물결치는 교류가 이 기기가 하는 일을 말한다 */}
        <rect x="10.2" y="7.6" width="9" height="5.4" rx="1" />
        <path d="M11.8 10.6q1-2 2 0t2 0" />
        <circle cx="21.8" cy="10.3" r="1.2" />
        {/* 방열 슬릿 */}
        <path d="M12 16.4v4M14.6 16.4v4M17.2 16.4v4M19.8 16.4v4" />
        {/* 아래로 빠지는 케이블 두 가닥 */}
        <path d="M13 24v3.6M19 24v3.6" />
      </>
    </Glyph>
  );
}

/*
  학교는 지붕을 눕히고 창을 줄지어 낸다.
  집(`HomeGlyph`)과 같은 박공지붕을 쓰면 둘이 구분되지 않는다 — 학교는 슬래브 지붕과
  깃대로, 집은 박공지붕과 현관 하나로 갈린다.
*/
function SchoolGlyph() {
  return (
    <Glyph fill="M6.4 12.4H25.6V15H23.6V26H8.4V15H6.4Z">
      <>
        <path d="M6.4 12.4H25.6V15H6.4Z" />
        <path d="M8.4 15V26H23.6V15" />
        <path d="M10.8 17.6h3v3h-3zM19.2 17.6h3v3h-3z" />
        <path d="M14 26v-4.6h4v4.6" />
        <path d="M20 12.4V6.6" />
        <path d="M20 6.6l4.4 1.5-4.4 1.5z" />
        <path d="M4 26h24" />
      </>
    </Glyph>
  );
}

const STEP_GLYPH: Record<StepId, () => ReactElement> = {
  sun: SunGlyph,
  cell: CellGlyph,
  inverter: InverterGlyph,
  school: SchoolGlyph,
};

export function StepGlyph({ id }: { id: StepId }) {
  const Shape = STEP_GLYPH[id];

  return <Shape />;
}

// ── 3장 · 반복해 늘어놓는 그림 ────────────────────────────
/** 두 단으로 앉힌 침엽수. 위 단이 아래 단 안에 들어와야 한 그루로 읽힌다 */
const CANOPY = 'M16 4.8L22.4 13.2H9.6ZM16 10L24.4 20.4H7.6Z';

/** 차체. 아래 선이 차체보다 길면 바닥에 걸친 판처럼 보인다 — 폭을 차체에 맞춘다 */
const AIRCON_BODY = 'M4.4 9.2h23.2a2 2 0 0 1 2 2v6.4a2 2 0 0 1-2 2H4.4a2 2 0 0 1-2-2v-6.4a2 2 0 0 1 2-2Z';

/** 박공지붕과 몸채 */
const HOUSE = 'M5.4 15L16 6.8L26.6 15V15.4H23.4V26H8.6V15.4H5.4Z';

function TreeGlyph() {
  return (
    <Glyph fill={CANOPY}>
      <>
        <path d="M16 4.8L22.4 13.2H9.6Z" />
        <path d="M16 10L24.4 20.4H7.6Z" />
        <path d="M16 20.4V26.4M12.6 26.4h6.8" />
      </>
    </Glyph>
  );
}

function AirconGlyph() {
  return (
    <Glyph fill={AIRCON_BODY}>
      <>
        <path d={AIRCON_BODY} />
        {/* 앞면 통풍구 한 줄 */}
        <path d="M5.6 16.4h20.8" />
        {/* 나오는 바람 셋 — 같은 곡선을 나란히 두어 「분다」 가 읽힌다 */}
        <path d="M9.2 22.4c0 2.4 2 2.8 2 5.2M16 22.4c0 2.4 2 2.8 2 5.2M22.8 22.4c0 2.4 2 2.8 2 5.2" />
      </>
    </Glyph>
  );
}

function HomeGlyph() {
  return (
    <Glyph fill={HOUSE}>
      <>
        <path d="M5.4 15L16 6.8L26.6 15" />
        <path d="M8.6 15.4V26H23.4V15.4" />
        <path d="M13.8 26v-6.2h4.4V26" />
        <path d="M10.6 17h2.8v2.8h-2.8z" />
        <path d="M3.4 26h25.2" />
      </>
    </Glyph>
  );
}

const SCALE_GLYPH: Record<ScaleId, () => ReactElement> = {
  tree: TreeGlyph,
  aircon: AirconGlyph,
  home: HomeGlyph,
};

export function ScaleGlyph({ id }: { id: ScaleId }) {
  const Shape = SCALE_GLYPH[id];

  return <Shape />;
}

// ── 장 제목에 붙는 그림 ───────────────────────────────────
/*
  장마다 하나씩. 네 질문이 각각 무엇을 묻는지 글자를 읽기 전에 한 번 알려 준다.

  걸음·잣대 그림과 결은 같되 뜻이 겹치지 않게 골랐다 — 계기는 「얼마나」, 번개는 「어떻게」,
  잎은 「무엇이 좋아졌나」, 오르내리는 화살표는 「왜 달라지나」 를 맡는다.
*/
function GaugeGlyph() {
  return (
    <Glyph fill="M16 6a13 13 0 0113 13v1.4H3V19A13 13 0 0116 6z">
      <>
        <path d="M3 20.4A13 13 0 0129 20.4" />
        <path d="M6.6 12.6l2.2 2.2M16 8.6v3.1M25.4 12.6l-2.2 2.2" />
        <path d="M16 20.4L21.8 13.4" />
        <circle cx="16" cy="20.4" r="2" />
        <path d="M4.6 24.6h22.8" />
      </>
    </Glyph>
  );
}

function BoltGlyph() {
  return (
    <Glyph fill="M18.4 3L8.6 17.4h6.2L13.6 29l9.8-14.4h-6.2z">
      <path d="M18.4 3L8.6 17.4h6.2L13.6 29l9.8-14.4h-6.2z" />
    </Glyph>
  );
}

function LeafGlyph() {
  return (
    <Glyph fill="M26 6c0 11.6-7.4 18.4-19.4 18.4C6.6 12.8 14 6 26 6z">
      <>
        <path d="M26 6c0 11.6-7.4 18.4-19.4 18.4C6.6 12.8 14 6 26 6z" />
        <path d="M9.4 21.6C13.8 17 18.6 12.6 23.6 8.8" />
        <path d="M5 28c1.2-2 2.4-3.6 3.6-4.9" />
      </>
    </Glyph>
  );
}

const CHAPTER_GLYPH: Record<ChapterId, () => ReactElement> = {
  principle: BoltGlyph,
  summary: GaugeGlyph,
  carbon: LeafGlyph,
};

export function ChapterGlyph({ id }: { id: ChapterId }) {
  const Shape = CHAPTER_GLYPH[id];

  return <Shape />;
}
