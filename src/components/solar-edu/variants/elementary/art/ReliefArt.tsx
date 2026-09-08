import { CastShadow, SceneDefs } from '@/components/solar-edu/scene-art/SceneDefs';
import { Box, Building, House, RoofPanel, Sun, Window } from '@/components/solar-edu/scene-art/SceneParts';
import styles from './PictureArt.module.scss';
import type { CSSProperties } from 'react';

/*
  초등 시안 c 의 입체 그림 (SFR-005-04/06).

  평면 그림(`PictureArt`)과 **같은 물건, 같은 자리, 같은 크기**를 그린다. 다른 것은 명암뿐이다 —
  두 시안을 나란히 놓고 고를 때 달라진 것이 「입체감 하나」로 좁혀져야, 무엇을 보고 고르는지가 분명해진다.

  입체는 원근법이 아니라 면을 갈라 만든다. 윗면은 밝고, 옆면은 한 단계 어둡고, 앞면은 그 사이다.
  빛은 늘 왼쪽 위에서 온다 — 이 규칙은 초등·중등 판이 쓰던 것을 그대로 가져왔고, 명암 정의도
  같은 `SceneDefs` 를 본다. 이 판만 다른 광원을 쓰면 같은 학교의 화면 셋이 서로 다른 곳처럼 보인다.

  평면 쪽에서 지켰던 두 가지는 여기서도 지킨다 — 햇님에게는 얼굴이 있고, 선은 굵다.
  명암을 얹었다고 잔 무늬를 늘리지 않는다. 멀리서 보는 화면에서 잔 무늬는 때가 될 뿐이다.
*/

/** 굵은 테두리 한 겹 */
const STROKE = 5;

/** 그림 상자 한 변 — 평면 쪽과 같은 상자를 써야 두 시안의 그림 크기가 같다 */
const BOX = 120;

/**
 * 얼굴이 있는 햇님.
 *
 * 몸통은 `scene-art` 의 해를 그대로 쓴다 — 가운데가 부풀어 오른 명암과 겹겹의 후광이 이미 들어 있어,
 * 평면 쪽의 납작한 원과 나란히 놓으면 차이가 곧바로 보인다. 그 위에 얼굴만 얹는다.
 */
export function ReliefSun({
  cx,
  cy,
  r = 60,
  asleep = false,
}: {
  cx: number;
  cy: number;
  r?: number;
  asleep?: boolean;
}) {
  return (
    <g className={styles.bob}>
      <Sun cx={cx} cy={cy} r={r} glowClass={styles.halo} rayClass={styles.spin} />

      {/* 얼굴 — 눈 둘과 웃는 입. 이 셋 말고는 아무것도 그리지 않는다 */}
      <g fill="none" stroke="var(--solar-text)" strokeWidth={r * 0.1} strokeLinecap="round">
        {asleep ? (
          <>
            <path d={`M${cx - r * 0.44} ${cy - r * 0.12}q${r * 0.16} ${r * 0.18} ${r * 0.32} 0`} />
            <path d={`M${cx + r * 0.12} ${cy - r * 0.12}q${r * 0.16} ${r * 0.18} ${r * 0.32} 0`} />
            <path d={`M${cx - r * 0.12} ${cy + r * 0.34}h${r * 0.24}`} />
          </>
        ) : (
          <>
            <circle cx={cx - r * 0.28} cy={cy - r * 0.14} r={r * 0.08} fill="var(--solar-text)" stroke="none" />
            <circle cx={cx + r * 0.28} cy={cy - r * 0.14} r={r * 0.08} fill="var(--solar-text)" stroke="none" />
            <path d={`M${cx - r * 0.34} ${cy + r * 0.22}q${r * 0.34} ${r * 0.4} ${r * 0.68} 0`} />
          </>
        )}
      </g>

      {asleep ? null : (
        <g fill="var(--solar-deep)" fillOpacity="0.32">
          <ellipse cx={cx - r * 0.52} cy={cy + r * 0.2} rx={r * 0.12} ry={r * 0.08} />
          <ellipse cx={cx + r * 0.52} cy={cy + r * 0.2} rx={r * 0.12} ry={r * 0.08} />
        </g>
      )}
    </g>
  );
}

/*
  `Building` 이 상수로 박아 둔 옥상 슬래브의 두께와 처마 폭.

  그 부품은 이 둘을 밖으로 내주지 않는데, 슬래브 위에 판을 얹고 그 앞면에 테두리를 덧그으려면
  같은 수를 알아야 한다. 부품을 고쳐 두 값을 내주게 만들면 초등·중등 판까지 함께 건드리게 되므로,
  여기서는 같은 수를 적어 두고 어디서 온 값인지만 밝혀 둔다.
*/
const SLAB = 14;
const EAVE = 7;

/**
 * 학교 한 채 — 입체.
 *
 * 몸통은 `scene-art` 의 `Building` 을 쓴다. 정면과 옆면을 갈라 세우고 그 위에 옥상 슬래브를 세 면으로
 * 얹는 물건이라, 평면 쪽의 네모 한 장과 견주면 「건물이 서 있다」 가 곧바로 읽힌다.
 *
 * 학교로 읽히게 하는 것은 입체가 아니라 여전히 세 가지다 — 가로로 긴 몸통, 규칙적으로 늘어선 창,
 * 가운데 현관. 여기에 정면 시계를 얹는다. 평면 쪽은 시계를 옥상 난간에 달았는데, `Building` 의
 * 슬래브는 두께가 14 로 고정이라 시계가 들어갈 자리가 없다 — 대신 창 두 줄 사이 한가운데에 건다.
 * 그 자리를 시계에 내주므로 현관 차양은 두지 않는다. 둘 다 가운데를 쓰겠다고 하면 겹친다.
 *
 * 명암을 얹었다고 **굵은 테두리를 놓지 않는다.** 처음에 `Building` 이 긋는 얇은 선(2)에 맡겼더니
 * 입체는 생겼는데 이 판의 그림이 아니게 됐다 — 멀리서 보면 형태가 물러 흐물거렸다. 부품이 그은 선
 * 위에 굵은 선을 한 겹 덧그어, 두께는 명암이 만들고 윤곽은 선이 잡게 나눈다.
 */
export function ReliefSchool({
  x,
  y,
  w = 260,
  h = 150,
  lit = true,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  lit?: boolean;
}) {
  const win = { w: w * 0.135, h: h * 0.26 };
  const colAt = (col: number) => w * 0.072 + col * (w * 0.186);
  const rowY = [h * 0.13, h * 0.58];

  /** 옥상 판 — 슬래브 윗면에 눕는다. 판의 기울기가 옥상의 기울기와 같아야 그 면에 놓인 것이 된다 */
  const panel = { w: w * 0.27, gap: w * 0.31, d: Math.max(12, w * 0.06) };

  return (
    <Building x={x} y={y} w={w} h={h} depth={w * 0.075}>
      {/*
        창 아홉.
        위 줄 다섯, 아래 줄 넷이다 — 아래 줄 한가운데는 현관이 쓴다.
        불이 켜진 창은 유리처럼 위쪽이 밝고, 꺼진 창은 벽보다 한 단계 잠긴 면으로 둔다.
      */}
      {rowY.map((top, row) =>
        [0, 1, 2, 3, 4].map((col) => {
          if (row === 1 && col === 2) return null;

          const box = { x: colAt(col), y: top, width: win.w, height: win.h, rx: 3 };

          return (
            <g key={`${row}-${col}`}>
              {lit ? (
                <>
                  <rect
                    {...box}
                    className={styles.window}
                    style={{ animationDelay: `${(row * 5 + col) * 0.28}s` } as CSSProperties}
                    fill="var(--solar)"
                  />
                  <rect {...box} fill="url(#edu-shine)" />
                </>
              ) : (
                <>
                  <rect {...box} fill="var(--surface-sunken)" />
                  <rect {...box} fill="url(#edu-shade)" />
                </>
              )}

              {/* 유리에 두르는 굵은 선 — 명암만으로는 멀리서 창이 벽에 녹아 사라진다 */}
              <rect {...box} fill="none" stroke="var(--brand-contrast)" strokeWidth="3.5" />
            </g>
          );
        }),
      )}

      {/*
        현관 — 문은 바닥까지 내려온다.

        반투명한 파랑에 흰 그라디언트를 얹었더니 회색 판이 됐다. 문 높이가 벽의 절반 가까이라
        위에서 내려오는 빛이 문 대부분을 덮어 버린 것이다. 색을 채워 두고 유리 반사만 한 줄 넣는다.
      */}
      <g>
        <rect x={w * 0.42} y={h * 0.56} width={w * 0.16} height={h * 0.44} rx="3" fill="var(--brand)" />
        <rect x={w * 0.42} y={h * 0.56} width={w * 0.16} height={h * 0.44} rx="3" fill="url(#edu-glass)" />
        <rect
          x={w * 0.42}
          y={h * 0.56}
          width={w * 0.16}
          height={h * 0.44}
          rx="3"
          fill="none"
          stroke="var(--brand-contrast)"
          strokeWidth="4"
        />
        {/* 여닫이 두 짝을 가르는 선 — 이것 하나로 판때기가 문이 된다 */}
        <path
          d={`M${w * 0.5} ${h * 0.56}V${h}`}
          stroke="var(--brand-contrast)"
          strokeWidth="3"
          strokeOpacity="0.55"
        />
      </g>

      {/*
        정면 시계.
        학교 건물에만 있는 물건이라 이것 하나로 「여기가 학교」 가 정해진다. 글자를 못 읽는 아이도
        시계는 알아본다. 창 두 줄 사이 빈 띠 한가운데에 걸어 어느 창과도 부딪히지 않게 한다.
      */}
      <g transform={`translate(${w / 2} ${h * 0.46})`}>
        <circle r={h * 0.075} fill="var(--surface)" filter="url(#edu-lift)" />
        <circle r={h * 0.075} fill="url(#edu-shine)" />
        <circle r={h * 0.075} fill="none" stroke="var(--brand-contrast)" strokeWidth="3.5" />
        <path
          d={`M0 0v${-h * 0.046}M0 0l${h * 0.034} ${h * 0.021}`}
          stroke="var(--brand-contrast)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </g>

      {/*
        몸통과 슬래브에 두르는 굵은 선.

        `Building` 도 테두리를 긋지만 굵기가 2 라, 초등·중등 화면에서는 알맞아도 멀리서 보는
        이 화면에서는 형태가 잡히지 않는다. 그 위에 한 겹 덧그어 윤곽만 굵게 만든다.
      */}
      <g fill="none" stroke="var(--brand-contrast)" strokeWidth={STROKE} strokeLinejoin="round">
        <rect x="0" y="0" width={w} height={h} />
        <rect x={-EAVE} y={-SLAB} width={w + EAVE * 2} height={SLAB} />
      </g>

      {/* 옥상 판 석 장 — 이 전기가 어디서 왔는지 그림이 말한다 */}
      {[0, 1, 2].map((slot) => (
        <RoofPanel
          key={slot}
          className={styles.panelGlint}
          style={{ animationDelay: `${slot * 0.6}s` } as CSSProperties}
          x={w * 0.06 + slot * panel.gap}
          y={-(SLAB + 5)}
          w={panel.w}
          d={panel.d}
        />
      ))}
    </Building>
  );
}

/**
 * 전기가 흘러가는 길 — 입체.
 *
 * 평면 쪽과 같은 길을 같은 자리에 긋되, 선에 두께를 준다. 어두운 밑선 위에 밝은 선을 조금 위로
 * 어긋내 얹으면 관이 둥글게 부푼 것처럼 보인다 — 흐르는 알갱이도 같은 규칙으로 위쪽이 밝다.
 */
export function ReliefFlow({
  d,
  color = 'var(--solar)',
  dots = 3,
}: {
  d: string;
  color?: string;
  dots?: number;
}) {
  return (
    <g>
      <path d={d} stroke="var(--brand-contrast)" strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d={d} stroke={color} strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* 관의 윗머리를 밝히는 한 줄 */}
      <path d={d} stroke="var(--paper)" strokeOpacity="0.45" strokeWidth="2.4" strokeLinecap="round" fill="none" />

      {Array.from({ length: dots }, (_, index) => (
        <g key={index}>
          <circle r="10" fill={color} stroke="var(--brand-contrast)" strokeWidth="3">
            <animateMotion dur="2.4s" repeatCount="indefinite" begin={`${(index * 2.4) / dots}s`} path={d} />
          </circle>
          <circle r="10" fill="url(#edu-orb)">
            <animateMotion dur="2.4s" repeatCount="indefinite" begin={`${(index * 2.4) / dots}s`} path={d} />
          </circle>
        </g>
      ))}
    </g>
  );
}

/**
 * 「아니에요」 를 뜻하는 금지 표지 — 입체.
 * 판을 띄워 그림 위에 얹은 스티커처럼 보이게 한다.
 */
function ReliefNo() {
  return (
    <g transform={`translate(${BOX * 0.74} ${BOX * 0.25})`}>
      <circle r="25" fill="var(--paper)" filter="url(#edu-lift)" />
      <circle r="25" fill="url(#edu-shine)" />
      <circle r="25" fill="none" stroke="var(--critical)" strokeWidth="8" />
      <path d="M-13 13 13 -13" stroke="var(--critical)" strokeWidth="8" strokeLinecap="round" />
    </g>
  );
}

/**
 * 바뀌기 전의 것 — 쌓인 전기 (입체).
 *
 * 옆의 나무·집과 같은 상자에 같은 굵기로 그린다. 그림이 없으면 그 칸만 다른 물건처럼 보여
 * 「이것이 저것으로 바뀌었다」 는 짝이 서지 않는다.
 *
 * 번개 하나로 둔다. 콘센트나 전선도 놓아 보았지만 이 나이가 「전기」 로 곧장 읽는 것은 번개였고,
 * 여러 물건을 겹치면 칸이 작아 무엇인지 알아보기 어려웠다.
 */
export function ReliefPowerArt() {
  const bolt = 'M68 12 34 66h20l-8 42 36-56H62Z';

  return (
    <svg viewBox={`0 0 ${BOX} ${BOX}`} fill="none" role="presentation">
      <SceneDefs />
      <CastShadow cx={60} cy={112} rx={30} ry={7} />

      {/* 두께 — 같은 모양을 살짝 내려 깔면 번개가 판때기가 아니라 덩어리가 된다 */}
      <path d={bolt} transform="translate(3 5)" fill="var(--brand-contrast)" fillOpacity="0.35" />
      <path d={bolt} fill="var(--solar)" />
      <path d={bolt} fill="url(#edu-orb)" />
      <path d={bolt} fill="none" stroke="var(--brand-contrast)" strokeWidth={STROKE} strokeLinejoin="round" />
    </svg>
  );
}

/**
 * 발전시간 — 시계 (입체).
 *
 * 모래시계로 그렸다가 시계로 바꿨다 (2026-09-07 지시). 모래시계가 「쌓이는 길이」 에 더 가깝긴
 * 하지만, 이 나이가 그림 하나로 「시간」 을 읽어 내는 물건은 시계 쪽이다 — 옆 칸이 「3시간 57분」
 * 이라고 적고 있으므로 그림까지 뜻을 새로 가르칠 필요가 없다.
 *
 * 바늘은 세 시 방향에서 조금 지난 자리에 세워 둔다. 열두 시 정각에 두면 두 바늘이 겹쳐 하나로
 * 보이고, 여섯 시로 두면 일직선이 되어 역시 시계로 읽히지 않는다.
 */
export function ReliefHourArt() {
  const face = 46;

  return (
    <svg viewBox={`0 0 ${BOX} ${BOX}`} fill="none" role="presentation">
      <SceneDefs />
      <CastShadow cx={60} cy={112} rx={34} ry={8} />

      {/* 꼭지와 고리 — 이것 둘이 붙어야 벽시계로 읽힌다 */}
      <rect x="52" y="4" width="16" height="10" rx="3" fill="var(--brand-contrast)" fillOpacity="0.55" />

      {/* 두께 — 같은 원을 살짝 내려 깔면 판때기가 아니라 덩어리가 된다 */}
      <circle cx={60} cy={65} r={face} fill="var(--brand-contrast)" fillOpacity="0.35" />

      <circle cx={60} cy={62} r={face} fill="var(--surface)" />
      <circle cx={60} cy={62} r={face} fill="url(#edu-orb)" />
      <circle cx={60} cy={62} r={face} fill="none" stroke="var(--brand-contrast)" strokeWidth={STROKE} />

      {/*
        열두 시·세 시·여섯 시·아홉 시 넉 점.
        열둘을 다 찍으면 이 크기에서 점들이 테두리로 뭉쳐 눈금이 아니라 띠로 보인다.
      */}
      {[
        [60, 62 - 32],
        [60 + 32, 62],
        [60, 62 + 32],
        [60 - 32, 62],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={3.4} fill="var(--brand-contrast)" fillOpacity="0.5" />
      ))}

      {/* 짧은바늘과 긴바늘 — 굵기로 둘을 가른다 */}
      <path d="M60 62 82 72" stroke="var(--solar-deep)" strokeWidth={STROKE + 1} strokeLinecap="round" />
      <path d="M60 62 66 34" stroke="var(--brand-contrast)" strokeWidth={STROKE} strokeLinecap="round" />
      <circle cx={60} cy={62} r={5} fill="var(--brand-contrast)" />
    </svg>
  );
}

/** 2장 — 오늘 만든 전기를 바꿔 세어 보는 것들 (입체) */
export function ReliefGiftArt({ id }: { id: 'tree' | 'aircon' | 'house' }) {
  if (id === 'tree') {
    /* 잎 덩어리 — 둘레를 여섯 번 부풀린 한 덩어리. 평면 쪽과 같은 모양을 쓴다 */
    const leaf = 'M60 16A17 17 0 0 1 84.2 30A17 17 0 0 1 84.2 58A17 17 0 0 1 60 72A17 17 0 0 1 35.8 58A17 17 0 0 1 35.8 30A17 17 0 0 1 60 16Z';

    return (
      <svg viewBox={`0 0 ${BOX} ${BOX}`} fill="none" role="presentation">
        <SceneDefs />
        <CastShadow cx={60} cy={110} rx={34} ry={8} />

        {/* 줄기 — 왼쪽만 밝혀 둥근 기둥으로 보이게 한다 */}
        <rect x="52" y="60" width="16" height="52" rx="4" fill="#7d5837" />
        <rect x="52" y="60" width="6" height="52" rx="3" fill="#fff" fillOpacity="0.22" />
        <rect x="52" y="60" width="16" height="52" rx="4" fill="none" stroke="var(--brand-contrast)" strokeWidth="4" />

        {/*
          잎.
          평면 쪽은 여기서 끝났다. 이쪽은 같은 덩어리에 공처럼 부푼 명암을 얹어 왼쪽 위가 환하고
          가장자리로 잠기게 한다 — 잎이 한 장이 아니라 한 덩이라는 것이 명암으로 보인다.
        */}
        <path className={styles.sway} d={leaf} fill="var(--ok)" />
        <path className={styles.sway} d={leaf} fill="url(#edu-orb)" />
        <path
          className={styles.sway}
          d={leaf}
          fill="none"
          stroke="var(--brand-contrast)"
          strokeWidth={STROKE}
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (id === 'aircon') {
    return (
      <svg viewBox={`0 0 ${BOX} ${BOX}`} fill="none" role="presentation">
        <SceneDefs />

        {/* 둥근 기계 한 덩이 — 아랫배를 깔아 두께를 만든다 */}
        <Box x={12} y={24} w={96} h={38} radius={16}>
          <rect x="14" y="24" width="68" height="7" rx="3.5" fill="var(--surface-sunken)" />
          <rect x="14" y="24" width="68" height="7" rx="3.5" fill="url(#edu-shade)" />
          <circle cx="80" cy="11" r="5" fill="var(--ok)" />
          <circle cx="80" cy="11" r="5" fill="url(#edu-orb)" />
        </Box>

        {/* 나오는 바람 — 물결이 아래로 흘러야 켜져 있는 것으로 보인다 */}
        <g stroke="var(--brand)" strokeWidth="6" strokeLinecap="round" fill="none">
          {[36, 60, 84].map((cx, index) => (
            <path
              key={cx}
              className={styles.breeze}
              style={{ animationDelay: `${index * 0.35}s` } as CSSProperties}
              d={`M${cx} 76q9 10 0 20t0 20`}
            />
          ))}
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${BOX} ${BOX}`} fill="none" role="presentation">
      <SceneDefs />

      {/*
        살림집 한 채.
        `scene-art` 의 집을 줄여 쓴다 — 처마를 내밀고 용마루를 세우고 굴뚝을 올린 물건이라,
        평면 쪽의 삼각형과 사각형 두 장과 견주면 차이가 가장 크게 나는 그림이다.
        제 좌표계가 상자보다 커서 통째로 줄여 앉힌다.
      */}
      <g transform="translate(11 46) scale(0.68)">
        <House x={0} y={0} w={148} h={82}>
          <Window x={20} y={18} w={34} h={28} className={styles.window} />
          <rect x="88" y="18" width="38" height="64" rx="3" fill="var(--brand)" fillOpacity="0.45" />
          <rect x="88" y="18" width="38" height="64" rx="3" fill="url(#edu-shine)" />
          <rect x="88" y="18" width="38" height="64" rx="3" fill="none" stroke="var(--brand-contrast)" strokeWidth="2.4" />
        </House>
      </g>
    </svg>
  );
}

/** 3장 — 태양광은 왜 좋은가 (입체) */
export function ReliefGoodArt({ id }: { id: 'free' | 'clean' | 'quiet' | 'roof' }) {
  if (id === 'free') {
    return (
      <svg viewBox={`0 0 ${BOX} ${BOX}`} fill="none" role="presentation">
        <SceneDefs />
        <CastShadow cx={60} cy={104} rx={34} ry={7} />

        {/*
          쌓아 둔 동전.
          평면 쪽은 타원 셋을 겹쳐 두께를 흉내 냈다. 이쪽은 동전마다 옆구리를 그려 실제로 두께를 준다 —
          윗면과 옆면이 갈리면 포개어 쌓은 것이 눈에 보인다.
        */}
        {[92, 74, 56].map((cy) => (
          <g key={cy}>
            <path d={`M28 ${cy}v-7a32 12 0 0 0 64 0v7a32 12 0 0 1 -64 0Z`} fill="var(--solar-deep)" />
            <path d={`M28 ${cy}v-7a32 12 0 0 0 64 0v7a32 12 0 0 1 -64 0Z`} fill="url(#edu-shade)" />
            <ellipse cx="60" cy={cy - 7} rx="32" ry="12" fill="var(--solar)" />
            <ellipse cx="60" cy={cy - 7} rx="32" ry="12" fill="url(#edu-shine)" />
            <ellipse cx="60" cy={cy - 7} rx="32" ry="12" fill="none" stroke="var(--brand-contrast)" strokeWidth="3.4" />
            <ellipse cx="60" cy={cy - 7} rx="17" ry="6" fill="none" stroke="var(--brand-contrast)" strokeWidth="2.2" strokeOpacity="0.4" />
          </g>
        ))}

        <ReliefNo />
      </svg>
    );
  }

  if (id === 'clean') {
    return (
      <svg viewBox={`0 0 ${BOX} ${BOX}`} fill="none" role="presentation">
        <SceneDefs />
        <CastShadow cx={46} cy={106} rx={28} ry={7} />

        {/*
          태우는 굴뚝.

          벽과 같은 밝은 색에 흰 하이라이트를 얹었더니 굴뚝이 아니라 흰 컵이 됐다. 태우는 설비는
          뒤로 물러나야 하는 것이라 회색으로 눌러 두고, 왼쪽만 밝혀 둥근 통으로 보이게 한다.
        */}
        <rect x="30" y="46" width="32" height="60" rx="3" fill="var(--text-faint)" />
        <rect x="30" y="46" width="11" height="60" rx="3" fill="#fff" fillOpacity="0.26" />
        <rect x="30" y="46" width="32" height="60" rx="3" fill="url(#edu-shade)" />
        <rect x="30" y="46" width="32" height="60" rx="3" fill="none" stroke="var(--brand-contrast)" strokeWidth={STROKE} />

        <rect x="22" y="36" width="48" height="14" rx="3" fill="var(--text-faint)" />
        <rect x="22" y="36" width="48" height="14" rx="3" fill="url(#edu-shine)" />
        <rect x="22" y="36" width="48" height="14" rx="3" fill="none" stroke="var(--brand-contrast)" strokeWidth="4" />

        {/*
          나지 않는 연기.
          옅게 두어야 표지가 「이건 없다」 로 읽히지만, 너무 옅으면 애초에 연기가 있었다는 것조차
          보이지 않아 표지가 무엇을 지우는지 알 수 없다.
        */}
        <g fill="var(--text-faint)" fillOpacity="0.5">
          <circle cx="72" cy="30" r="15" />
          <circle cx="92" cy="18" r="10" />
        </g>

        <ReliefNo />
      </svg>
    );
  }

  if (id === 'quiet') {
    return (
      <svg viewBox={`0 0 ${BOX} ${BOX}`} fill="none" role="presentation">
        <SceneDefs />

        {/* 시끄러운 소리 — 음표 머리를 공처럼 부풀린다 */}
        <g transform="translate(6 0)">
          <g transform="rotate(-18 42 82)">
            <ellipse cx="42" cy="82" rx="20" ry="15" fill="var(--brand)" />
            <ellipse cx="42" cy="82" rx="20" ry="15" fill="url(#edu-orb)" />
            <ellipse cx="42" cy="82" rx="20" ry="15" fill="none" stroke="var(--brand-contrast)" strokeWidth={STROKE} />
          </g>
          <path d="M60 78V26" stroke="var(--brand-contrast)" strokeWidth="8" strokeLinecap="round" />
          <path d="M58 76V28" stroke="var(--paper)" strokeOpacity="0.35" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M60 26q26 8 22 32" stroke="var(--brand-contrast)" strokeWidth="8" strokeLinecap="round" fill="none" />
        </g>

        <ReliefNo />
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${BOX} ${BOX}`} fill="none" role="presentation">
      <SceneDefs />
      <CastShadow cx={60} cy={104} rx={44} ry={8} />

      {/*
        우리 학교 옥상 한 조각 — 표지가 없는 유일한 그림이다.
        슬래브를 세 면으로 갈라 세우고 그 위에 눕는 판을 얹는다. 판이 옥상과 같은 방향으로
        물러나야 그 면에 놓인 것이 된다.
      */}
      <path d="M10 88 26 72h84L94 88Z" fill="var(--surface-sunken)" />
      <path d="M10 88 26 72h84L94 88Z" fill="url(#edu-shine)" />
      <rect x="10" y="88" width="84" height="14" rx="2" fill="var(--surface)" />
      <rect x="10" y="88" width="84" height="14" rx="2" fill="url(#edu-shade)" />
      <path
        d="M10 88 26 72h84L94 88v14H10Z"
        fill="none"
        stroke="var(--brand-contrast)"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {[0, 1].map((slot) => (
        <RoofPanel
          key={slot}
          className={styles.panelGlint}
          style={{ animationDelay: `${slot * 0.6}s` } as CSSProperties}
          x={18 + slot * 40}
          y={86}
          w={34}
          d={14}
        />
      ))}
    </svg>
  );
}
