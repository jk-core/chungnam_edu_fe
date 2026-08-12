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
 * 상자 한 덩이 (인버터·에어컨 같은 것).
 * 정면·윗면·옆면 세 면을 갈라 놓아야 벽에 붙은 판때기가 아니라 부피를 가진 기계로 보인다.
 */
export function Box({
  x,
  y,
  w,
  h,
  depth = 14,
  radius = 6,
  /** 태우는 설비처럼 뒤로 물러나야 하는 것은 어둡게 칠한다 */
  dim = false,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  depth?: number;
  radius?: number;
  dim?: boolean;
  children?: ReactNode;
}) {
  const face = dim ? 'var(--text-faint)' : 'var(--surface)';
  const back = dim ? 'var(--text-faint)' : 'var(--surface-sunken)';

  return (
    <g transform={`translate(${x} ${y})`} opacity={dim ? 0.55 : 1}>
      <CastShadow cx={w / 2} cy={h + 8} rx={w * 0.56} ry={9} />

      {/* 윗면과 옆면 — 정면보다 먼저 그려 뒤로 물린다 */}
      <path d={`M0 0 ${depth} ${-depth}h${w}L${w} 0Z`} fill={back} />
      <path d={`M0 0 ${depth} ${-depth}h${w}L${w} 0Z`} fill="url(#edu-shine)" />
      <path d={`M${w} 0 ${w + depth} ${-depth}v${h}L${w} ${h}Z`} fill={back} />
      <path d={`M${w} 0 ${w + depth} ${-depth}v${h}L${w} ${h}Z`} fill="url(#edu-side)" />

      {/* 정면 */}
      <rect x="0" y="0" width={w} height={h} rx={radius} fill={face} />
      <rect x="0" y="0" width={w} height={h} rx={radius} fill="url(#edu-shine)" />
      <rect
        x="0.9"
        y="0.9"
        width={w - 1.8}
        height={h - 1.8}
        rx={radius}
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
export function Building({
  x,
  y,
  w,
  h,
  depth = 22,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  depth?: number;
  children?: ReactNode;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <CastShadow cx={w / 2 + depth / 2} cy={h + 6} rx={w * 0.62} ry={11} />

      {/* 옥상 슬래브 — 살짝 내밀어 처마를 만든다 */}
      <path d={`M-6 0 ${depth - 6} ${-depth}h${w + 12}L${w + 6} 0Z`} fill="var(--surface-sunken)" />
      <path d={`M-6 0 ${depth - 6} ${-depth}h${w + 12}L${w + 6} 0Z`} fill="url(#edu-shine)" />

      {/* 옆면 */}
      <path d={`M${w} 0 ${w + depth} ${-depth}v${h}L${w} ${h}Z`} fill="var(--surface)" />
      <path d={`M${w} 0 ${w + depth} ${-depth}v${h}L${w} ${h}Z`} fill="url(#edu-side)" />

      {/* 정면 */}
      <rect x="0" y="0" width={w} height={h} fill="var(--surface)" />
      <rect x="0" y="0" width={w} height={h} fill="url(#edu-shine)" />
      <path
        d={`M0 0h${w}v${h}H0Z M${w} 0 ${w + depth} ${-depth}v${h}L${w} ${h}`}
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

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
