import { CastShadow } from './SceneDefs';
import type { ReactNode } from 'react';

/*
  교육용 그림이 나눠 쓰는 부품.

  같은 물건을 화면마다 다시 그리면 조금씩 어긋나 한 세계로 보이지 않는다. 태양광 판·상자·건물·해·나무를
  여기 한 벌만 두고 자리와 크기만 바꿔 쓴다.

  입체는 원근법이 아니라 **면을 갈라** 만든다 — 윗면은 밝고, 옆면은 한 단계 어둡고, 앞면은 그 사이다.
  빛은 늘 왼쪽 위에서 온다고 정해 두었다. 그림마다 광원이 다르면 나란히 놓았을 때 어색해진다.
*/

/**
 * 기울여 세운 태양광 판.
 *
 * 평행사변형 한 장으로 끝내면 종이처럼 얇다. 판 두께와 지지대, 바닥 그림자까지 있어야 지붕 위에
 * 놓인 물건으로 읽힌다. 유리 반사를 한 줄기 얹어 셀 격자가 유리 아래 있는 것처럼 보이게 했다.
 */
export function SolarPanel({
  x,
  y,
  scale = 1,
  glow = 0,
  children,
}: {
  x: number;
  y: number;
  scale?: number;
  /** 지금 얼마나 만들고 있는지 (0~1). 많이 만들수록 판이 환하다 */
  glow?: number;
  children?: ReactNode;
}) {
  const top = 'M0 86 56 0h150l-56 86Z';

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <CastShadow cx={100} cy={104} rx={104} ry={16} />

      {/* 판 두께 — 앞 모서리와 왼쪽 모서리가 보인다 */}
      <path d="M0 86h150v11H0Z" fill="var(--brand-contrast)" />
      <path d="M0 86 56 0v11L0 97Z" fill="var(--brand-contrast)" fillOpacity="0.75" />

      {/* 판 윗면 */}
      <path d={top} fill="var(--brand)" />
      <path d={top} fill="var(--solar)" fillOpacity={glow} />
      <path d={top} fill="url(#edu-shade)" />

      {/* 셀 격자 — 유리 아래 비친다 */}
      <g stroke="var(--paper)" strokeOpacity="0.34" strokeWidth="1.4">
        <path d="M42 21h150M28 43h150M14 65h150" />
        <path d="M84 0 28 86M134 0 78 86M184 0 128 86" />
      </g>

      {/* 유리 반사 */}
      <path d={top} fill="url(#edu-glass)" />
      <path d={top} fill="none" stroke="var(--paper)" strokeOpacity="0.4" strokeWidth="1.6" />

      {/* 지지대 — 한쪽만 밝혀 기둥으로 보이게 한다 */}
      <g>
        <path d="M36 97h9v24h-9Z" fill="var(--text-faint)" />
        <path d="M36 97h3.5v24H36Z" fill="#fff" fillOpacity="0.3" />
        <path d="M126 97h9v24h-9Z" fill="var(--text-faint)" />
        <path d="M126 97h3.5v24H126Z" fill="#fff" fillOpacity="0.3" />
      </g>

      {children}
    </g>
  );
}

/**
 * 둥근 기계 한 덩이 (인버터·에어컨 같은 것).
 *
 * 뒤로 각진 면을 덧대 입체를 만들면 둥근 모서리와 어긋나 상자가 삐죽 튀어나온 것처럼 보인다.
 * 실제 기계는 모서리가 둥글게 말려 있으므로, 같은 둥근 모양을 아래로 한 겹 깔아 두께를 만들고
 * 윗머리를 밝혀 부피를 낸다.
 */
export function Box({
  x,
  y,
  w,
  h,
  radius = 12,
  /** 태우는 설비처럼 뒤로 물러나야 하는 것은 어둡게 칠한다 */
  dim = false,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: number;
  dim?: boolean;
  children?: ReactNode;
}) {
  const face = dim ? 'var(--text-faint)' : 'var(--surface)';

  return (
    <g transform={`translate(${x} ${y})`} opacity={dim ? 0.55 : 1}>
      <CastShadow cx={w / 2} cy={h + 11} rx={w * 0.54} ry={9} />

      {/* 두께 — 같은 둥근 모양을 아래로 한 겹 깔아 아랫배를 만든다 */}
      <rect x="2.5" y="7" width={w - 5} height={h} rx={radius} fill="var(--border-strong)" opacity="0.7" />

      {/* 본체 */}
      <rect x="0" y="0" width={w} height={h} rx={radius} fill={face} />
      <rect x="0" y="0" width={w} height={h} rx={radius} fill="url(#edu-shine)" />
      <rect x="0" y="0" width={w} height={h} rx={radius} fill="url(#edu-shade)" />
      <rect
        x="1"
        y="1"
        width={w - 2}
        height={h - 2}
        rx={radius - 1}
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth="1.8"
      />

      {children}
    </g>
  );
}

/**
 * 건물 한 채.
 * 정면과 옆면을 갈라 세우고 옥상을 얹는다. 창은 유리처럼 위쪽이 밝다.
 */
/** 옥상 슬래브 두께 */
const ROOF = 14;

/** 슬래브가 처마처럼 내미는 폭 */
const EAVE = 7;

/**
 * 건물 한 채.
 *
 * 정면과 옆면을 갈라 세우고 그 위에 옥상 슬래브를 얹는다. 슬래브는 앞면·윗면·옆면 세 면을 다 그려야
 * 건물에 얹힌 판으로 읽힌다 — 앞면만 그리면 벽에 붙인 띠처럼 보이고, 윗면이 없으면 그 위에 무언가
 * 올려놓을 자리가 없어 태양광 판이 공중에 뜬다.
 */
export function Building({
  x,
  y,
  w,
  h,
  depth = 22,
  /** 지붕을 따로 얹는 집처럼, 옥상이 필요 없을 때 */
  flat = false,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  depth?: number;
  flat?: boolean;
  children?: ReactNode;
}) {
  const d = depth;
  const body = `M${w} 0 ${w + d} ${-d}v${h}L${w} ${h}Z`;

  /** 슬래브 윗면 — 여기가 태양광 판이 놓이는 바닥이다 */
  const slabTop = `M${-EAVE} ${-ROOF} ${d - EAVE} ${-d - ROOF}h${w + EAVE * 2}L${w + EAVE} ${-ROOF}Z`;
  const slabSide = `M${w + EAVE} ${-ROOF} ${w + d + EAVE} ${-d - ROOF}v${ROOF}L${w + EAVE} 0Z`;

  /*
    내민 처마의 밑면.

    슬래브가 벽보다 옆으로 EAVE 만큼 나와 있으니, 벽 옆면의 윗모서리와 슬래브 옆면의 아랫모서리는
    나란하되 어긋난 두 선이다. 그 사이를 메우지 않으면 띠 모양으로 배경이 새어 나오고, 벽 윗모서리가
    슬래브를 뚫고 나온 것처럼 보인다. 실제로 그 자리에 보이는 것은 처마의 밑바닥이다 — 가장 어둡다.
  */
  const slabUnder = `M${w} 0 ${w + d} ${-d}h${EAVE}L${w + EAVE} 0Z`;

  return (
    <g transform={`translate(${x} ${y})`}>
      <CastShadow cx={w / 2 + d / 2} cy={h + 6} rx={w * 0.62} ry={11} />

      {/* 몸통 옆면 — 옥상보다 먼저 그려 뒤로 물린다 */}
      <path d={body} fill="var(--surface)" />
      <path d={body} fill="url(#edu-side)" />

      {/* 몸통 정면 */}
      <rect x="0" y="0" width={w} height={h} fill="var(--surface)" />
      <rect x="0" y="0" width={w} height={h} fill="url(#edu-shine)" />

      {/*
        몸통 테두리는 슬래브보다 **먼저** 긋는다.
        나중에 그으면 슬래브에 가려져야 할 벽 윗모서리가 옥상 위로 겹쳐 그어진다.
      */}
      <path
        d={`M0 0h${w}v${h}H0Z ${body}`}
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {flat ? null : (
        <g>
          {/* 처마 밑면 */}
          <path d={slabUnder} fill="var(--surface-sunken)" />
          <path d={slabUnder} fill="#0b1524" fillOpacity="0.3" />

          {/* 슬래브 윗면 — 판이 놓이는 바닥 */}
          <path d={slabTop} fill="var(--surface-sunken)" />
          <path d={slabTop} fill="url(#edu-shine)" />

          {/* 슬래브 옆면 */}
          <path d={slabSide} fill="var(--surface-sunken)" />
          <path d={slabSide} fill="url(#edu-side)" />

          {/* 슬래브 앞면 — 처마가 되어 벽 위로 그늘을 드리운다 */}
          <rect x={-EAVE} y={-ROOF} width={w + EAVE * 2} height={ROOF} fill="var(--surface)" />
          <rect x={-EAVE} y={-ROOF} width={w + EAVE * 2} height={ROOF} fill="url(#edu-shade)" />

          <path
            d={`M${-EAVE} ${-ROOF}h${w + EAVE * 2}v${ROOF}H${-EAVE}Z ${slabTop} M${w + EAVE} ${-ROOF} ${w + d + EAVE} ${-d - ROOF}v${ROOF} M${w} 0 ${w + d} ${-d}h${EAVE}`}
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </g>
      )}

      {children}
    </g>
  );
}

/**
 * 옥상에 눕는 태양광 판.
 *
 * 세워 둔 `SolarPanel` 을 줄여 얹으면 판의 기울기와 옥상의 기울기가 달라 지붕을 뚫고 뜬 것처럼 보인다.
 * 옥상은 뒤로 갈수록 오른쪽 위로 물러나므로(1, -1), 판도 같은 방향으로 누워야 그 면에 놓인 것이 된다.
 * 앞 모서리에만 두께를 두어 종이가 아니라 판으로 읽히게 했다.
 */
export function RoofPanel({
  x,
  y,
  w = 60,
  d = 16,
  className,
  style,
}: {
  /** 판의 앞왼쪽 모서리 */
  x: number;
  y: number;
  w?: number;
  /** 옥상 안쪽으로 물러나는 깊이 */
  d?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const top = `M0 0h${w}l${d} ${-d}h${-w}Z`;

  return (
    <g transform={`translate(${x} ${y})`}>
      {/* 자리 잡기와 움직임을 층으로 나눈다 — 한 요소에 겹치면 CSS 가 SVG transform 을 덮어쓴다 */}
      <g className={className} style={style}>
        <path d={`M0 0h${w}v3H0Z`} fill="var(--brand-contrast)" />

        <path d={top} fill="var(--brand)" />
        <g stroke="var(--paper)" strokeOpacity="0.3" strokeWidth="1">
          <path d={`M${d / 2} ${-d / 2}h${w}`} />
          <path d={`M${w / 3} 0l${d} ${-d}M${(w * 2) / 3} 0l${d} ${-d}`} />
        </g>
        <path d={top} fill="url(#edu-glass)" />
        <path d={top} fill="none" stroke="var(--brand-contrast)" strokeWidth="1.6" strokeLinejoin="round" />
      </g>
    </g>
  );
}

/**
 * 살림집 한 채.
 *
 * 학교와 달리 뾰족한 지붕을 인다. 처마를 내밀고 용마루를 세우고 굴뚝을 하나 올려야 "집" 으로 읽힌다 —
 * 삼각형과 사각형만으로는 도형이지 집이 아니다.
 */
export function House({
  x,
  y,
  w = 148,
  h = 82,
  children,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  children?: ReactNode;
}) {
  const peak = 62;
  const eave = 14;
  const roof = `M${w / 2} ${-peak}L${w + eave} 4H${-eave}Z`;

  /*
    굴뚝은 지붕 뒤에서 솟는 것으로 그린다 — 비탈 위에 얹으려면 비탈면과 만나는 자리를 따로 오려야 하는데,
    그러고도 결국 잘린 밑동만 보인다.

    다만 밑동이 짧으면 지붕면보다 위에서 끝나 밑변 선이 지붕 한가운데에 떠 보인다. 그래서 굴뚝의
    오른쪽 모서리에서 비탈이 지나는 높이를 재고, 그보다 더 내려가도록 길이를 잡는다.
  */
  const slope = (peak + 4) / (w / 2 + eave);
  const stackX = w * 0.66;
  const stackW = 20;
  const stackBottom = -peak + (stackX + stackW - w / 2) * slope + 8;
  const stackTop = -peak - 16;

  return (
    <g transform={`translate(${x} ${y})`}>
      <CastShadow cx={w / 2} cy={h + 8} rx={w * 0.66} ry={11} />

      {/* 벽 — 지붕보다 먼저 세운다. 나중에 그리면 벽 윗변 선이 지붕 위로 겹쳐 그어진다 */}
      <rect x="0" y="0" width={w} height={h} rx="3" fill="var(--surface)" />
      <rect x="0" y="0" width={w} height={h} rx="3" fill="url(#edu-shine)" />
      <rect x="0" y="0" width={w} height={h} rx="3" fill="url(#edu-shade)" />
      <rect
        x="0.9"
        y="0.9"
        width={w - 1.8}
        height={h - 1.8}
        rx="3"
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth="1.8"
      />

      {/* 굴뚝 */}
      <g>
        <rect x={stackX} y={stackTop} width={stackW} height={stackBottom - stackTop} fill="var(--surface)" />
        <rect x={stackX} y={stackTop} width={stackW} height={stackBottom - stackTop} fill="url(#edu-shade)" />
        <rect x={stackX - 3.5} y={stackTop - 8} width={stackW + 7} height="8" rx="2" fill="var(--surface-sunken)" />
        <rect x={stackX - 3.5} y={stackTop - 8} width={stackW + 7} height="8" rx="2" fill="url(#edu-shine)" />
        <path
          d={`M${stackX} ${stackBottom}V${stackTop}h${stackW}v${stackBottom - stackTop} M${stackX - 3.5} ${stackTop - 8}h${stackW + 7}v8h${-stackW - 7}Z`}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </g>

      {/* 지붕 — 오른쪽 비탈을 눌러 두 면으로 갈라 놓는다. 벽과 굴뚝 밑동을 함께 덮는다 */}
      <path d={roof} fill="var(--brand)" />
      <path d={`M${w / 2} ${-peak}L${w + eave} 4H${w / 2}Z`} fill="#0b1524" fillOpacity="0.18" />
      <path d={roof} fill="url(#edu-shine)" fillOpacity="0.55" />

      {/* 용마루와 처마 끝 */}
      <path d={roof} fill="none" stroke="var(--brand-contrast)" strokeWidth="2.4" strokeLinejoin="round" />
      <path d={`M${-eave} 4h${w + eave * 2}`} stroke="var(--brand-contrast)" strokeWidth="3.4" strokeLinecap="round" />

      {children}
    </g>
  );
}

/** 창 하나 — 유리처럼 위쪽이 밝다 */
export function Window({
  x,
  y,
  w = 30,
  h = 26,
  className,
  style,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <g className={className} style={style}>
      <rect x={x} y={y} width={w} height={h} rx="3" fill="var(--solar)" />
      <rect x={x} y={y} width={w} height={h} rx="3" fill="url(#edu-shine)" />
      <rect x={x} y={y} width={w} height={h} rx="3" fill="none" stroke="var(--solar-deep)" strokeOpacity="0.35" strokeWidth="1.2" />
    </g>
  );
}

/**
 * 해.
 * 평평한 원에 빛살만 붙이면 스티커처럼 보인다. 가운데가 부풀어 오른 듯한 명암과 겹겹의 후광이 있어야
 * 스스로 빛나는 덩어리로 읽힌다.
 */
export function Sun({
  cx,
  cy,
  r = 30,
  glowClass,
  rayClass,
}: {
  cx: number;
  cy: number;
  r?: number;
  glowClass?: string;
  rayClass?: string;
}) {
  return (
    <g>
      <circle className={glowClass} cx={cx} cy={cy} r={r * 1.75} fill="var(--solar)" fillOpacity="0.16" />
      <circle cx={cx} cy={cy} r={r * 1.28} fill="var(--solar)" fillOpacity="0.22" />

      <g className={rayClass} style={{ transformOrigin: `${cx}px ${cy}px` }} stroke="var(--solar-deep)" strokeWidth={r * 0.11} strokeLinecap="round">
        <path
          d={`M${cx} ${cy - r * 1.55}v${r * 0.3}M${cx} ${cy + r * 1.25}v${r * 0.3}M${cx - r * 1.55} ${cy}h${r * 0.3}M${cx + r * 1.25} ${cy}h${r * 0.3}`}
        />
        <path
          d={`M${cx - r * 1.1} ${cy - r * 1.1}l${r * 0.23} ${r * 0.23}M${cx + r * 0.87} ${cy + r * 0.87}l${r * 0.23} ${r * 0.23}M${cx - r * 1.1} ${cy + r * 1.1}l${r * 0.23} ${-r * 0.23}M${cx + r * 0.87} ${cy - r * 0.87}l${r * 0.23} ${-r * 0.23}`}
        />
      </g>

      <circle cx={cx} cy={cy} r={r} fill="var(--solar)" />
      <circle cx={cx} cy={cy} r={r} fill="url(#edu-orb)" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--solar-deep)" strokeOpacity="0.55" strokeWidth="1.6" />
    </g>
  );
}

/**
 * 침엽수 한 그루 (밑동이 원점).
 * 잎 층마다 왼쪽을 밝히고 오른쪽을 눌러 둥글게 부푼 것처럼 보이게 한다.
 */
export function Conifer({ swayClass, style }: { swayClass?: string; style?: React.CSSProperties }) {
  const tiers = [
    { top: -104, half: 28, base: -64 },
    { top: -82, half: 34, base: -36 },
    { top: -58, half: 40, base: -8 },
  ];

  return (
    <g>
      <CastShadow cx={0} cy={10} rx={44} ry={9} />

      <g className={swayClass} style={style}>
        {tiers.map((tier) => {
          const shape = `M0 ${tier.top} ${tier.half} ${tier.base}H${-tier.half}Z`;

          return (
            <g key={tier.top}>
              <path d={shape} fill="var(--ok)" />
              {/* 오른쪽 절반만 눌러 둥글게 만든다 */}
              <path d={`M0 ${tier.top} ${tier.half} ${tier.base}H0Z`} fill="#0b1524" fillOpacity="0.16" />
              <path d={shape} fill="url(#edu-shine)" fillOpacity="0.55" />
            </g>
          );
        })}
      </g>

      <path d="M-7 -12h14v22H-7Z" fill="#7d5837" />
      <path d="M-7 -12h5v22h-5Z" fill="#fff" fillOpacity="0.22" />
    </g>
  );
}
