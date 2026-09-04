import { CastShadow, SceneDefs } from '@/components/solar-edu/scene-art/SceneDefs';
import styles from './PictureArt.module.scss';
import type { CSSProperties, ReactNode } from 'react';

/*
  그림이 본문인 초등 판(시안 b·c)이 나눠 쓰는 그림 부품 (SFR-005-04/06/07).

  중·고등이 쓰는 `scene-art` 부품을 그대로 줄여 쓰지 않는다. 그쪽은 **사실에 가깝게** 그린 것이라
  면을 여러 겹 갈라 두께를 만드는데, 멀리서 보는 이 화면에서는 그 겹이 뭉개져 회색 덩어리가 된다.
  여기서는 반대로 간다 — 면을 하나로 두고, 선을 굵게 하고, 모서리를 둥글게 만다.

  햇님에게는 얼굴을 준다. 이 나이가 화면에서 가장 먼저 찾는 것이 얼굴이고, 얼굴이 있으면
  그것이 이야기의 주인공이 된다. 글로 "햇님이 전기를 만들어요" 라고 적는 대신, 얼굴 있는 햇님이
  판을 내려다보게 두면 같은 말이 그림만으로 선다.

  색은 기존 토큰만 쓴다. 이 판만 색을 새로 들이면 같은 학교의 화면 셋이 서로 다른 곳처럼 보인다.
*/

/** 굵은 테두리 한 겹 — 이 부품의 모든 도형이 같은 굵기를 쓴다 */
const STROKE = 5;

/**
 * 얼굴이 있는 햇님.
 *
 * 빛살은 천천히 돌고 몸은 위아래로 통통 뜬다. 두 움직임의 주기를 서로 나누어떨어지지 않게 두어,
 * 오래 보고 있어도 같은 자리로 돌아오는 순간이 눈에 띄지 않는다.
 *
 * 해가 진 뒤에는 눈을 감긴다. 「해가 지면 전기를 만들지 않아요」 를 글로 적는 대신
 * 자는 얼굴로 보이면, 저녁에 복도를 지나는 아이도 화면이 고장 난 것이 아님을 안다.
 */
export function PictureSun({
  cx,
  cy,
  r = 60,
  asleep = false,
}: {
  cx: number;
  cy: number;
  r?: number;
  /** 해가 진 뒤 — 눈을 감고 잔다 */
  asleep?: boolean;
}) {
  return (
    <g className={styles.bob}>
      {/* 후광 두 겹 — 스스로 빛나는 덩어리로 보이게 한다 */}
      <circle className={styles.halo} cx={cx} cy={cy} r={r * 1.6} fill="var(--solar)" fillOpacity="0.14" />
      <circle cx={cx} cy={cy} r={r * 1.24} fill="var(--solar)" fillOpacity="0.2" />

      {/* 빛살 — 뭉툭하고 굵게. 가늘면 멀리서 사라진다 */}
      <g
        className={styles.spin}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        stroke="var(--solar-deep)"
        strokeWidth={r * 0.16}
        strokeLinecap="round"
      >
        {Array.from({ length: 8 }, (_, index) => {
          const rad = (index * Math.PI) / 4;
          const from = r * 1.2;
          const to = r * 1.46;

          return (
            <line
              key={index}
              x1={cx + Math.cos(rad) * from}
              y1={cy + Math.sin(rad) * from}
              x2={cx + Math.cos(rad) * to}
              y2={cy + Math.sin(rad) * to}
            />
          );
        })}
      </g>

      <circle cx={cx} cy={cy} r={r} fill="var(--solar)" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--solar-deep)" strokeWidth={STROKE} />

      {/* 얼굴 — 눈 둘과 웃는 입. 이 셋 말고는 아무것도 그리지 않는다 */}
      <g fill="none" stroke="var(--solar-text)" strokeWidth={r * 0.1} strokeLinecap="round">
        {asleep ? (
          <>
            <path d={`M${cx - r * 0.44} ${cy - r * 0.12}q${r * 0.16} ${r * 0.18} ${r * 0.32} 0`} />
            <path d={`M${cx + r * 0.12} ${cy - r * 0.12}q${r * 0.16} ${r * 0.18} ${r * 0.32} 0`} />
          </>
        ) : (
          <>
            <circle cx={cx - r * 0.28} cy={cy - r * 0.14} r={r * 0.08} fill="var(--solar-text)" stroke="none" />
            <circle cx={cx + r * 0.28} cy={cy - r * 0.14} r={r * 0.08} fill="var(--solar-text)" stroke="none" />
          </>
        )}

        {/* 자는 동안에는 입도 작게 오므린다 */}
        {asleep ? (
          <path d={`M${cx - r * 0.12} ${cy + r * 0.34}h${r * 0.24}`} />
        ) : (
          <path d={`M${cx - r * 0.34} ${cy + r * 0.22}q${r * 0.34} ${r * 0.4} ${r * 0.68} 0`} />
        )}
      </g>

      {/* 볼 — 자는 얼굴에는 두지 않는다. 깨어 있을 때만 발그레하다 */}
      {asleep ? null : (
        <g fill="var(--solar-deep)" fillOpacity="0.32">
          <ellipse cx={cx - r * 0.52} cy={cy + r * 0.2} rx={r * 0.12} ry={r * 0.08} />
          <ellipse cx={cx + r * 0.52} cy={cy + r * 0.2} rx={r * 0.12} ry={r * 0.08} />
        </g>
      )}
    </g>
  );
}

/**
 * 학교 한 채.
 *
 * 처음에는 삼각 지붕을 인 집으로 그렸는데, 그건 학교가 아니라 살림집이다 — 이 화면이 말하는 것이
 * 「우리 **학교** 지붕이 만드는 전기」 인데 그림은 남의 집을 보여 주고 있었다.
 *
 * 학교로 읽히게 하는 것은 지붕이 아니라 세 가지다. 가로로 긴 몸통, 규칙적으로 늘어선 창,
 * 그리고 가운데 현관. 여기에 아이가 학교를 알아보는 표시 하나를 더 얹었다 — 옥상의 시계다.
 *
 * 지붕은 평평하게 둔다. 실제 학교 건물이 그렇기도 하고, 평지붕이라야 태양광 판이 비탈에 얹힌
 * 장식이 아니라 **옥상에 세워 둔 설비**로 보인다. 판은 해를 향해 비스듬히 세운다.
 *
 * 창은 하나씩 차례로 켜진다 — 전기가 지금 쓰이고 있다는 것을 창 말고 다른 데서 말하지 않는다.
 */
export function PictureSchool({
  x,
  y,
  w = 260,
  h = 150,
  /** 창에 불이 들어와 있는지. 해가 진 뒤에도 학교는 어둡지 않다 */
  lit = true,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  lit?: boolean;
}) {
  /** 옥상 난간 — 정면이 시계를 다는 자리이자 판이 서는 바닥이다 */
  const parapet = h * 0.2;
  const eave = w * 0.04;

  /** 창 한 칸. 다섯 칸이 같은 간격으로 늘어서야 「교실이 여럿」 으로 읽힌다 */
  const win = { w: w * 0.128, h: h * 0.27, gap: w * 0.1875 };

  /*
    옥상 판.

    평지붕 위에 비스듬히 세운다. 아래 모서리를 옥상 바닥에 붙이고 위 모서리를 왼쪽으로 밀어
    평행사변형을 만들면, 그림자를 그리지 않고도 「기울여 세워 둔 판」 이 된다.
  */
  const panel = { w: w * 0.2, h: h * 0.17 };
  const tilt = panel.h * 0.5;
  const panelFace = `M0 0h${panel.w}l${-tilt} ${-panel.h}h${-panel.w}Z`;

  return (
    <g transform={`translate(${x} ${y})`}>
      <CastShadow cx={w / 2} cy={h + 10} rx={w * 0.62} ry={14} />

      {/* 몸통 — 가로로 길다. 이 비례가 살림집과 학교를 가르는 첫 번째 표시다 */}
      <rect x="0" y="0" width={w} height={h} rx="6" fill="var(--surface)" />
      <rect x="0" y="0" width={w} height={h} rx="6" fill="none" stroke="var(--brand-contrast)" strokeWidth={STROKE} />

      {/* 층을 가르는 띠 — 한 덩이 상자가 아니라 층이 쌓인 건물로 보이게 한다 */}
      <path d={`M0 ${h * 0.5}h${w}`} stroke="var(--brand-contrast)" strokeWidth="3" strokeOpacity="0.35" />

      {/*
        창 아홉.

        위 줄 다섯, 아래 줄 넷이다 — 아래 줄 한가운데는 현관이 쓴다. 규칙적으로 늘어선 창이
        학교로 읽히게 하는 두 번째 표시이고, 가운데가 비어 현관이 들어서는 것이 세 번째다.
      */}
      {[0, 1].map((row) =>
        [0, 1, 2, 3, 4].map((col) => {
          if (row === 1 && col === 2) return null;

          return (
            <rect
              key={`${row}-${col}`}
              className={lit ? styles.window : undefined}
              style={{ animationDelay: `${(row * 5 + col) * 0.28}s` } as CSSProperties}
              x={w * 0.075 + col * win.gap}
              y={row === 0 ? h * 0.13 : h * 0.58}
              width={win.w}
              height={win.h}
              rx="3"
              fill={lit ? 'var(--solar)' : 'var(--surface-sunken)'}
              stroke="var(--brand-contrast)"
              strokeWidth="3.5"
            />
          );
        }),
      )}

      {/* 현관 — 문은 바닥까지 내려온다. 차양을 얹어야 드나드는 자리로 보인다 */}
      <rect
        x={w * 0.42}
        y={h * 0.58}
        width={w * 0.16}
        height={h * 0.42}
        rx="3"
        fill="var(--brand)"
        fillOpacity="0.45"
        stroke="var(--brand-contrast)"
        strokeWidth="4"
      />
      <rect
        x={w * 0.385}
        y={h * 0.53}
        width={w * 0.23}
        height={h * 0.06}
        rx="3"
        fill="var(--brand)"
        stroke="var(--brand-contrast)"
        strokeWidth="3.5"
      />

      {/* 옥상 난간 */}
      <rect
        x={-eave}
        y={-parapet}
        width={w + eave * 2}
        height={parapet}
        rx="4"
        fill="var(--brand)"
        stroke="var(--brand-contrast)"
        strokeWidth={STROKE}
      />

      {/*
        옥상 시계.

        학교 건물에만 있는 물건이라 이것 하나로 「여기가 학교」 가 정해진다. 글자를 못 읽는
        아이도 시계는 알아본다 — 교실마다 하나씩 걸려 있다.
        바늘은 세워 두고 움직이지 않는다. 진짜 시각은 화면 오른쪽 위가 이미 말하고 있고,
        여기서 또 돌면 볼 곳이 둘이 된다.
      */}
      <g transform={`translate(${w / 2} ${-parapet * 0.52})`}>
        <circle r={parapet * 0.32} fill="var(--surface)" stroke="var(--paper)" strokeWidth="3.5" />
        <path
          d={`M0 0v${-parapet * 0.2}M0 0l${parapet * 0.15} ${parapet * 0.09}`}
          stroke="var(--brand-contrast)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </g>

      {/* 옥상 판 석 장 — 이 전기가 어디서 왔는지 그림이 말한다 */}
      {[0.07, 0.4, 0.73].map((at, slot) => (
        <g key={at} transform={`translate(${w * at} ${-parapet})`}>
          {/*
            판은 흰 테두리를 두른다.

            처음에는 지붕과 같은 계열의 짙은 남색으로만 칠했는데, 파란 난간 위에 얹으니 명도가
            너무 가까워 판이 통째로 사라졌다 — 멀리서 보는 화면에서 색상 차이는 명도 차이를
            이기지 못한다. 흰 테두리 한 겹이면 어떤 바탕 위에서도 판의 윤곽이 남는다.
          */}
          <path
            className={styles.panelGlint}
            style={{ animationDelay: `${slot * 0.6}s` } as CSSProperties}
            d={panelFace}
            fill="var(--brand-contrast)"
            stroke="var(--paper)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* 셀 격자 — 판이 유리 한 장이 아니라 여러 칸으로 나뉜 물건임을 말한다 */}
          <path
            d={`M${panel.w / 3} 0l${-tilt} ${-panel.h}M${(panel.w * 2) / 3} 0l${-tilt} ${-panel.h}M${-tilt / 2} ${-panel.h / 2}h${panel.w}`}
            stroke="var(--paper)"
            strokeOpacity="0.45"
            strokeWidth="2"
          />
        </g>
      ))}
    </g>
  );
}

/**
 * 전기가 흘러가는 길.
 *
 * 선 위로 동그란 알갱이가 줄지어 지나간다. 화살표를 쓰지 않는 것은, 화살표가 「방향」 이라는
 * 약속을 이미 배운 사람에게만 방향으로 읽히기 때문이다. 실제로 움직이는 점은 배우지 않아도 보인다.
 */
export function PictureFlow({
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
      <path d={d} stroke="var(--brand-contrast)" strokeWidth="11" strokeLinecap="round" fill="none" />
      <path d={d} stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />

      {Array.from({ length: dots }, (_, index) => (
        <circle key={index} r="9" fill={color} stroke="var(--brand-contrast)" strokeWidth="3">
          {/*
            알갱이를 길 위로 실어 나른다.
            CSS `offset-path` 로도 되지만 SVG 쪽 애니메이션을 쓰면 길을 문자열 하나로만 넘기면 되고,
            길이 바뀌어도 스타일을 따라 고칠 곳이 생기지 않는다.
          */}
          <animateMotion dur="2.4s" repeatCount="indefinite" begin={`${(index * 2.4) / dots}s`} path={d} />
        </circle>
      ))}
    </g>
  );
}

/*
  ── 2장·3장의 그림 ────────────────────────────────────────

  둘 다 120×120 상자에 그린다. 자리마다 크기가 달라도(시안 A 는 화면 절반, 시안 D 는 손바닥만 하게)
  같은 상자를 쓰면 어느 화면에서 보든 같은 물건으로 알아본다.
*/

/** 그림 상자 한 변 */
const BOX = 120;

/**
 * 「아니에요」 를 뜻하는 금지 표지.
 *
 * 처음에는 그림 전체를 가로지르는 큰 가위표를 그렸는데, 그러자 획이 대상을 거의 다 덮어
 * **무엇에 아니라고 하는지**가 보이지 않았다. 「돈이 안 든다」 가 「돈」 조차 안 보이는 그림이 된 것이다.
 *
 * 대상은 온전히 두고 오른쪽 위에 표지 하나를 얹는다. 붉은 원에 사선 하나 — 길에서도 문에서도
 * 쓰는 모양이라 이 나이가 이미 알고 있고, 배지가 대상을 살짝 물고 있어 무엇에 붙은 표지인지도 분명하다.
 */
function PictureNo() {
  return (
    <g transform={`translate(${BOX * 0.74} ${BOX * 0.25})`}>
      <circle r="25" fill="var(--paper)" />
      <circle r="25" fill="none" stroke="var(--critical)" strokeWidth="8" />
      <path d="M-13 13 13 -13" stroke="var(--critical)" strokeWidth="8" strokeLinecap="round" />
    </g>
  );
}

/**
 * 2장 — 오늘 만든 전기를 바꿔 세어 보는 것들 (SFR-005-03/05).
 *
 * 초등 판이 같은 값을 같은 그림으로 보인다. 여기서는 선을 굵히고 잔 무늬를 걷어냈을 뿐이라,
 * 이 판에서 보던 아이가 다른 시안에서 같은 값을 만났을 때 같은 것을 말하고 있다는 걸 알아본다.
 */
export function PictureGiftArt({ id }: { id: 'tree' | 'aircon' | 'house' }) {
  if (id === 'tree') {
    return (
      <svg viewBox={`0 0 ${BOX} ${BOX}`} fill="none" role="presentation">
        <SceneDefs />
        <CastShadow cx={60} cy={110} rx={34} ry={8} />

        {/*
          줄기를 먼저 세우고 수관으로 밑동을 덮는다.

          수관을 완전한 원 하나로 얹었더니 나무가 아니라 막대사탕이 됐다. 잎은 매끈한 공이 아니라
          여러 덩어리가 뭉친 것이라, 둘레를 여섯 번 부풀려 울퉁불퉁하게 만든다 — 원을 여섯 개
          겹쳐 그리는 대신 바깥으로 휜 호 여섯을 이어 한 덩어리로 그리면 안쪽에 선이 남지 않는다.
        */}
        <rect x="52" y="60" width="16" height="52" rx="4" fill="#7d5837" stroke="var(--brand-contrast)" strokeWidth="4" />
        <path
          className={styles.sway}
          d="M60 16A17 17 0 0 1 84.2 30A17 17 0 0 1 84.2 58A17 17 0 0 1 60 72A17 17 0 0 1 35.8 58A17 17 0 0 1 35.8 30A17 17 0 0 1 60 16Z"
          fill="var(--ok)"
          stroke="var(--brand-contrast)"
          strokeWidth={STROKE}
          strokeLinejoin="round"
        />
        <circle cx="50" cy="34" r="9" fill="var(--paper)" fillOpacity="0.26" />
      </svg>
    );
  }

  if (id === 'aircon') {
    return (
      <svg viewBox={`0 0 ${BOX} ${BOX}`} fill="none" role="presentation">
        <SceneDefs />

        <rect x="14" y="24" width="92" height="38" rx="16" fill="var(--surface)" stroke="var(--brand-contrast)" strokeWidth={STROKE} />
        <rect x="26" y="48" width="68" height="7" rx="3.5" fill="var(--surface-sunken)" stroke="var(--brand-contrast)" strokeWidth="2.5" />
        <circle cx="92" cy="35" r="5" fill="var(--ok)" stroke="var(--brand-contrast)" strokeWidth="2.5" />

        {/* 나오는 바람 — 물결이 아래로 흘러야 켜져 있는 것으로 보인다 */}
        <g stroke="var(--brand)" strokeWidth="6" strokeLinecap="round" fill="none">
          {[36, 60, 84].map((cx, index) => (
            <path
              key={cx}
              className={styles.breeze}
              style={{ animationDelay: `${index * 0.35}s` } as CSSProperties}
              d={`M${cx} 70q9 10 0 20t0 20`}
            />
          ))}
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${BOX} ${BOX}`} fill="none" role="presentation">
      <SceneDefs />
      <CastShadow cx={60} cy={108} rx={38} ry={8} />

      <rect x="22" y="54" width="76" height="52" rx="4" fill="var(--surface)" stroke="var(--brand-contrast)" strokeWidth={STROKE} />
      {/* 지붕은 벽 윗변을 덮도록 나중에 그린다 */}
      <path d="M60 12 108 56H12Z" fill="var(--brand)" stroke="var(--brand-contrast)" strokeWidth={STROKE} strokeLinejoin="round" />
      <rect x="50" y="76" width="22" height="30" rx="3" fill="var(--brand)" fillOpacity="0.45" stroke="var(--brand-contrast)" strokeWidth="4" />
      <rect className={styles.window} x="30" y="64" width="16" height="16" rx="2" fill="var(--solar)" stroke="var(--brand-contrast)" strokeWidth="3.5" />
    </svg>
  );
}

/**
 * 3장 — 태양광은 왜 좋은가 (SFR-005-02).
 *
 * 넷 가운데 셋이 「없다」 는 이야기라 셋 다 가위표를 쓴다. 기호를 하나로 밀어야 이 나이가 그것을
 * 규칙으로 읽고, 가위표가 없는 넷째(지붕)가 그래서 눈에 걸린다.
 */
export function PictureGoodArt({ id }: { id: 'free' | 'clean' | 'quiet' }) {
  if (id === 'free') {
    return (
      <svg viewBox={`0 0 ${BOX} ${BOX}`} fill="none" role="presentation">
        <SceneDefs />
        <CastShadow cx={60} cy={104} rx={34} ry={7} />

        {/*
          쌓아 둔 동전.
          햇님도 노란 원이라 한 개만 두면 헷갈린다 — 셋을 포개 두면 두께가 생겨 「돈」 이 된다.
        */}
        {[92, 74, 56].map((cy) => (
          <g key={cy}>
            <ellipse cx="60" cy={cy} rx="32" ry="12" fill="var(--solar)" stroke="var(--brand-contrast)" strokeWidth="4" />
            <ellipse cx="60" cy={cy} rx="17" ry="6" fill="none" stroke="var(--brand-contrast)" strokeWidth="2.5" strokeOpacity="0.4" />
          </g>
        ))}

        <PictureNo />
      </svg>
    );
  }

  if (id === 'clean') {
    return (
      <svg viewBox={`0 0 ${BOX} ${BOX}`} fill="none" role="presentation">
        <SceneDefs />
        <CastShadow cx={46} cy={106} rx={28} ry={7} />

        {/* 태우는 굴뚝 */}
        <rect x="30" y="46" width="32" height="60" rx="3" fill="var(--surface-sunken)" stroke="var(--brand-contrast)" strokeWidth={STROKE} />
        <rect x="24" y="38" width="44" height="12" rx="3" fill="var(--surface-sunken)" stroke="var(--brand-contrast)" strokeWidth="4" />

        {/* 나지 않는 연기 — 옅게 두어야 가위표가 「이건 없다」 로 읽힌다 */}
        <g fill="var(--text-faint)" fillOpacity="0.3">
          <circle cx="72" cy="30" r="15" />
          <circle cx="92" cy="18" r="10" />
        </g>

        <PictureNo />
      </svg>
    );
  }

  if (id === 'quiet') {
    return (
      <svg viewBox={`0 0 ${BOX} ${BOX}`} fill="none" role="presentation">
        <SceneDefs />

        {/* 시끄러운 소리 — 음표 하나면 충분하다 */}
        <g transform="translate(6 0)">
          <ellipse cx="42" cy="82" rx="20" ry="15" transform="rotate(-18 42 82)" fill="var(--brand)" stroke="var(--brand-contrast)" strokeWidth={STROKE} />
          <path d="M60 78V26" stroke="var(--brand-contrast)" strokeWidth="7" strokeLinecap="round" />
          <path d="M60 26q26 8 22 32" stroke="var(--brand-contrast)" strokeWidth="7" strokeLinecap="round" fill="none" />
        </g>

        <PictureNo />
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${BOX} ${BOX}`} fill="none" role="presentation">
      <SceneDefs />
      <CastShadow cx={60} cy={106} rx={44} ry={8} />

      {/* 우리 학교 옥상 한 조각 — 가위표가 없는 유일한 그림이다 */}
      <rect x="10" y="82" width="100" height="20" rx="4" fill="var(--brand)" stroke="var(--brand-contrast)" strokeWidth={STROKE} />

      {[18, 64].map((px, index) => (
        <g key={px} transform={`translate(${px} 82)`}>
          <path
            className={styles.panelGlint}
            style={{ animationDelay: `${index * 0.6}s` } as CSSProperties}
            d="M0 0h38l-16-32H-16Z"
            fill="var(--brand-contrast)"
            stroke="var(--paper)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path d="M13 0-3-32M-8 -16h38" stroke="var(--paper)" strokeOpacity="0.45" strokeWidth="2" />
        </g>
      ))}
    </svg>
  );
}

/**
 * 그림 아래 붙는 말 — 세 시안이 같은 모양을 쓴다.
 *
 * 두 글자짜리 한 마디만 두었더니 화면이 아무것도 알려 주지 않았고, 문장을 두 줄 얹었더니
 * 그림이 본문인 화면이 아니게 됐다. 큰 한 마디와 그 아래 짧은 한 줄, 둘로 나누면 멀리서는 한 마디만
 * 읽히고 가까이 선 아이에게는 선생님이 아랫줄을 읽어 줄 수 있다.
 */
export function PictureWord({ word, line }: { word: ReactNode; line?: string }) {
  return (
    <div key={String(word)} className={styles.word}>
      <p className={styles.word__main}>{word}</p>
      {line ? <p className={styles.word__line}>{line}</p> : null}
    </div>
  );
}
