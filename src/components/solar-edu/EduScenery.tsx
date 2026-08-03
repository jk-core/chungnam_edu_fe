import styles from './SolarEdu.module.scss';
import type { CSSProperties, ReactNode, SVGProps } from 'react';

type ArtProps = SVGProps<SVGSVGElement>;

/**
 * 전기의 여정 네 단계를 그린 설명 삽화 (SFR-005-02).
 *
 * 아이콘이 "무슨 단계인지" 를 가리킨다면, 이 그림은 "그 단계가 어떻게 생겼는지" 를 보여 준다.
 * 이미지 파일 대신 SVG 로 그린 이유는 세 가지다 — 대형 모니터에서 흐려지지 않고,
 * 색을 디자인 토큰으로 잡아 라이트·다크가 따라오며, 받아 올 정적 자산이 늘지 않는다.
 *
 * 2:1 아이소메트릭(가로 2 : 세로 1) 격자에 맞춰 면을 채운 평면 도법으로 통일했고,
 * 설비는 실물 사진의 비례를 따랐다. 설비는 밑면 그림자를 깔아 바닥에 놓인 것으로 읽히게 했다.
 *
 * 움직이는 부분은 모두 CSS `@keyframes` 다. 이 화면은 미리보기 창처럼 문서가 가려진 채로
 * 돌 수 있는데, 그때 rAF 는 멈추지만 CSS 애니메이션은 계속 돈다.
 */
function Base({ children, ...rest }: ArtProps) {
  return (
    <svg
      viewBox="0 0 200 140"
      width="100%"
      height="100%"
      fill="none"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      {...rest}
    >
      {children}
    </svg>
  );
}

/**
 * 네 장면이 함께 딛고 선 바닥 — 같은 자리에 두어 연작으로 읽히게 한다.
 *
 * 가로 78 : 세로 39, 곧 기울기 0.5 의 2:1 아이소메트릭이다. 이 화면의 모든 설비가
 * 같은 기울기로 서 있으므로 물체의 밑면 모서리와 바닥 모서리가 나란히 놓인다.
 */
function Ground() {
  return (
    <g>
      <path d="M100 59 178 98 100 137 22 98Z" fill="var(--ok-soft)" />
      <path d="M100 59 178 98 100 137 22 98Z" stroke="var(--ok)" strokeOpacity="0.32" strokeWidth="1.2" />
      {/* 안쪽으로 한 겹 더 — 바닥이 평면이라는 것을 얇은 선 하나로 알린다 */}
      <path d="M100 69 161 98 100 127 39 98Z" stroke="var(--ok)" strokeOpacity="0.16" strokeWidth="1" />
    </g>
  );
}

/** 애니메이션 시작 시각을 어긋내 여러 알갱이가 줄지어 흐르게 한다. */
export const delay = (seconds: number) => ({ animationDelay: `${seconds}s` }) as CSSProperties;

/** 1단계 — 햇빛이 내리쬔다 */
export const SunlightArt = (props: ArtProps) => (
  <Base {...props}>
    <Ground />

    {/* 내리쬐는 빛줄기. 굵기를 달리해 거리감을 준다 */}
    <g stroke="var(--solar)" strokeLinecap="round" strokeOpacity="0.4">
      <path d="M143 55 72 108" strokeWidth="10" />
      <path d="M157 63 98 111" strokeWidth="6.5" />
      <path d="M131 49 56 99" strokeWidth="5" />
    </g>

    {/* 빛줄기를 타고 내려오는 빛알 — 빛이 알갱이로 온다는 것을 움직임으로 보인다 */}
    <g fill="var(--solar-deep)">
      <circle className={styles.artPhoton} cx="118" cy="76" r="2.8" />
      <circle className={styles.artPhoton} style={delay(0.9)} cx="128" cy="70" r="2.4" />
      <circle className={styles.artPhoton} style={delay(1.8)} cx="112" cy="82" r="2.2" />
    </g>

    {/* 해 — 번짐은 숨 쉬듯 커졌다 작아지고, 광선은 좌우로 천천히 돈다 */}
    <circle className={styles.artSunGlow} cx="146" cy="40" r="30" fill="var(--solar)" fillOpacity="0.16" />
    <circle cx="146" cy="40" r="21" fill="var(--solar)" stroke="var(--solar-deep)" strokeWidth="1.6" />
    <circle cx="141" cy="35" r="8" fill="var(--paper)" fillOpacity="0.35" />
    <g className={styles.artSunRays} stroke="var(--solar-deep)" strokeWidth="2.6" strokeLinecap="round">
      <path d="M146 6v8M146 66v8M112 40h8M172 40h8" />
      <path d="M121 15l5.6 5.6M165.4 59.4l5.6 5.6M121 65l5.6-5.6M165.4 20.6l5.6-5.6" />
    </g>

    {/* 구름 두 덩이 — 일사가 늘 최대치는 아니라는 표시 */}
    <path
      d="M34 50h32a8.6 8.6 0 0 0 .9-17.2 11.8 11.8 0 0 0-22.5 2.8A7.5 7.5 0 0 0 34 50Z"
      fill="var(--surface)"
      stroke="var(--border)"
      strokeWidth="1.4"
    />
    <path
      d="M74 68h16a5 5 0 0 0 .5-10 6.9 6.9 0 0 0-13.1 1.6A4.4 4.4 0 0 0 74 68Z"
      fill="var(--surface)"
      fillOpacity="0.75"
      stroke="var(--border)"
      strokeWidth="1.2"
    />

    {/* 바닥에 닿아 데워진 자리. 바닥과 같은 2:1 비율이라 평면에 누운 원으로 보인다 */}
    <ellipse cx="82" cy="108" rx="26" ry="13" fill="var(--solar)" fillOpacity="0.28" />
    <ellipse cx="82" cy="108" rx="14" ry="7" fill="var(--solar)" fillOpacity="0.32" />
  </Base>
);

/** 2단계 — 태양전지가 직류를 만든다 */
export const PanelArt = (props: ArtProps) => (
  <Base {...props}>
    <Ground />

    {/* 뒤쪽 모듈 한 장 — 한 장이 아니라 여러 장을 늘어놓는다는 것을 보인다 */}
    <g opacity="0.5">
      <g stroke="var(--text-faint)" strokeWidth="2.4" strokeLinecap="round">
        <path d="M110 48v16M166 40v16" />
      </g>
      <path d="M104 44 140 26 172 38 136 56Z" fill="var(--brand)" stroke="var(--brand-contrast)" strokeWidth="1.4" />
      <g stroke="var(--paper)" strokeOpacity="0.5" strokeWidth="1.1">
        <path d="M116 40 148 52M128 34 160 46M122 51 154 33" />
      </g>
    </g>

    {/* 앞쪽 모듈 — 지지대, 두께, 셀 격자 */}
    <g stroke="var(--text-faint)" strokeWidth="3.4" strokeLinecap="round">
      <path d="M44 82v24M96 100v30M148 74v30" />
    </g>

    <path d="M38 80 96 52 150 72 92 100Z" fill="var(--brand-contrast)" fillOpacity="0.4" />
    <path d="M38 76 96 48 150 68 92 96Z" fill="var(--brand)" stroke="var(--brand-contrast)" strokeWidth="1.8" />

    {/* 셀 격자 — 4×3 으로 나눠 여러 장을 이어 붙인 판임을 보인다 */}
    <g stroke="var(--paper)" strokeOpacity="0.5" strokeWidth="1.2">
      <path d="M52.5 69 106.5 89M67 62 121 82M81.5 55 135.5 75" />
      <path d="M56 86 114 58M74 92 132 64" />
    </g>

    {/* 판 위를 스치는 햇빛 — 판이 유리라는 느낌 */}
    <path className={styles.artSweep} d="M96 48 120 57 82 76 58 67Z" fill="var(--paper)" />

    {/* 접속함 — 판이 만든 직류가 여기로 모인다 */}
    <path d="M138 78 148 82 148 89 138 85Z" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.3" />

    {/* 케이블과 그 위를 줄지어 흘러 나가는 전기 */}
    <path
      d="M148 86q12 6 14 18"
      stroke="var(--solar-deep)"
      strokeWidth="2.6"
      strokeLinecap="round"
      fill="none"
    />
    <g fill="var(--solar)">
      <circle className={styles.artSpark} r="3.2" />
      <circle className={styles.artSpark} style={delay(0.63)} r="3.2" />
      <circle className={styles.artSpark} style={delay(1.26)} r="3.2" />
    </g>
  </Base>
);

/**
 * 3단계 — 인버터가 교류로 바꾼다.
 * 실물 사진의 비례를 따랐다: 세로로 긴 몸통, 위아래 짙은 커버, 가운데 표시창과 조작 버튼,
 * 오른쪽 옆면의 방열핀. 밑면 그림자를 깔아 바닥에 놓인 것으로 읽히게 했다.
 */
export const InverterArt = (props: ArtProps) => (
  <Base {...props}>
    <Ground />

    {/* 밑면 그림자 — 바닥과 같은 기울기로 깔되 해 반대쪽으로 조금 밀어 그림자로 읽히게 한다 */}
    <path d="M74 102 116 123 138 112 96 91Z" fill="var(--text-faint)" fillOpacity="0.18" />

    {/* 들어오는 직류 — 굽이 없이 곧게 뻗은 선을 따라 전기가 본체로 빨려 들어간다 */}
    <path d="M8 75H68" stroke="var(--solar-deep)" strokeWidth="2.8" strokeLinecap="round" />
    <g fill="var(--solar)">
      <circle className={styles.artDcIn} r="3.4" />
      <circle className={styles.artDcIn} style={delay(0.7)} r="3.4" />
      <circle className={styles.artDcIn} style={delay(1.4)} r="3.4" />
    </g>
    <text x="10" y="65" fill="var(--solar-deep)" fontSize="11" fontFamily="Space Grotesk, sans-serif">
      DC
    </text>

    {/*
      본체. 면마다 불투명한 색을 따로 줘 명암을 낸다 — 반투명으로 어둡게 하면
      뒤의 바닥선이 면을 뚫고 비쳐 보인다.
    */}
    <path d="M90 30 132 51 110 62 68 41Z" fill="var(--border)" stroke="var(--border-strong)" strokeWidth="1.2" />
    <path d="M68 41 110 62 110 120 68 99Z" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.2" />
    <path d="M132 51 110 62 110 120 132 109Z" fill="var(--surface-sunken)" stroke="var(--border-strong)" strokeWidth="1.2" />

    {/* 위아래 짙은 커버 — 실물의 검은 상·하판 */}
    <path d="M68 41 110 62 110 66.6 68 45.6Z" fill="var(--text-faint)" />
    <path d="M68 83.9 110 104.9 110 120 68 99Z" fill="var(--text-faint)" />
    <path d="M132 51 110 62 110 66.6 132 55.6Z" fill="var(--text-muted)" />
    <path d="M132 93.9 110 104.9 110 120 132 109Z" fill="var(--text-muted)" />

    {/* 표시창 */}
    <path d="M74.7 50.2 103.3 64.4 103.3 78.3 74.7 64.1Z" fill="var(--border-strong)" />
    <path d="M77.2 53.7 100.8 65.5 100.8 74.8 77.2 63Z" fill="var(--brand)" />
    <g stroke="var(--paper)" strokeOpacity="0.85" strokeWidth="1.3">
      <path d="M79.8 57.3 91.5 63.2M79.8 60.8 95.7 68.8" />
    </g>

    {/* 조작 버튼 넉 줄 */}
    <g fill="var(--text-muted)">
      <circle cx="78.9" cy="72.6" r="2.6" />
      <circle cx="85.6" cy="75.9" r="2.6" />
      <circle cx="92.4" cy="79.3" r="2.6" />
      <circle cx="99.1" cy="82.6" r="2.6" />
    </g>

    {/* 동작 표시등 — 돌고 있다는 뜻으로 천천히 깜빡인다 */}
    <circle className={styles.artBlink} cx="71.8" cy="69" r="2.2" fill="var(--ok)" />

    {/* 옆면 방열핀 */}
    <g stroke="var(--border-strong)" strokeWidth="1.2">
      <path d="M129.4 60.4 112.6 68.8M129.4 64.5 112.6 72.9M129.4 68.5 112.6 76.9M129.4 72.6 112.6 81M129.4 76.7 112.6 85.1M129.4 80.7 112.6 89.1M129.4 84.8 112.6 93.2" />
    </g>

    {/*
      나가는 교류. 들어올 때와 색을 달리해 "다른 전기가 되어 나간다" 는 것을 색으로도 알린다 —
      직류는 주황, 교류는 초록이고, 학교로 이어지는 다음 단계의 전선 색과 같다.
    */}
    <path
      d="M132 92q6-11 12 0t12 0 12 0"
      stroke="var(--ok)"
      strokeWidth="2.8"
      strokeLinecap="round"
      fill="none"
    />
    <g fill="var(--ok)">
      <circle className={styles.artAcOut} r="3.4" />
      <circle className={styles.artAcOut} style={delay(0.7)} r="3.4" />
      <circle className={styles.artAcOut} style={delay(1.4)} r="3.4" />
    </g>
    <text x="148" y="78" fill="var(--ok-text)" fontSize="11" fontFamily="Space Grotesk, sans-serif">
      AC
    </text>
  </Base>
);

/** 4단계 — 학교가 쓰고 남으면 계통으로 보낸다 */
export const GridArt = (props: ArtProps) => (
  <Base {...props}>
    <Ground />

    {/* 송전탑 — 건물과 사이를 벌려 전선이 완만하게 걸리도록 바닥 오른쪽 끝에 세웠다 */}
    <g stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round">
      <path d="M144 106 152 34 160 106" />
      <path d="M146 88h12M148 70h8M149.8 54h4.4" />
      <path d="M146 88 156 70M158 88 148 70" strokeWidth="1.1" />
      <path d="M140 42h24M143 52h18" />
    </g>
    <g fill="var(--text-faint)" fillOpacity="0.7">
      <circle cx="140" cy="44" r="1.9" />
      <circle cx="164" cy="44" r="1.9" />
      <circle cx="143" cy="54" r="1.7" />
    </g>

    {/* 밑면 그림자 — 바닥과 같은 기울기로 깔되 해 반대쪽으로 조금 밀어 그림자로 읽히게 한다 */}
    <path d="M46 95 104 124 122 115 64 86Z" fill="var(--text-faint)" fillOpacity="0.18" />

    {/*
      학교 건물. 폭이 깊이의 세 배가 넘는 가로로 긴 직육면체다 — 교실을 한 줄로 늘어놓는
      학교 건물의 생김새를 따랐다. 면마다 불투명한 색을 따로 줘 명암을 낸다.
    */}
    <path d="M58 37 116 66 98 75 40 46Z" fill="var(--paper)" stroke="var(--border-strong)" strokeWidth="1.2" />
    <path d="M40 46 98 75 98 121 40 92Z" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.2" />
    <path d="M116 66 98 75 98 121 116 112Z" fill="var(--surface-sunken)" stroke="var(--border-strong)" strokeWidth="1.2" />

    {/* 옥상 난간 — 지붕 가장자리를 한 겹 두른다 */}
    <path d="M60.4 39.3 111.4 64.8 95.6 72.7 44.6 47.2Z" stroke="var(--border-strong)" strokeWidth="1.1" />

    {/* 지붕 위 모듈 석 장 */}
    <g stroke="var(--brand-contrast)" strokeWidth="1.1">
      <path d="M45.3 45.9 59.6 53 72.1 46.8 57.8 39.6Z" fill="var(--brand)" />
      <path d="M64.6 55.6 78.9 62.7 91.4 56.5 77.1 49.3Z" fill="var(--brand)" />
      <path d="M83.9 65.3 98.2 72.4 110.7 66.2 96.4 59Z" fill="var(--brand)" />
    </g>
    <g stroke="var(--paper)" strokeOpacity="0.5" strokeWidth="1">
      <path d="M52.4 49.5 64.9 43.2M51.5 42.8 65.8 49.9" />
      <path d="M71.7 59.2 84.2 52.9M70.8 52.4 85.1 59.6" />
      <path d="M91 68.9 103.5 62.6M90.1 62.1 104.4 69.3" />
    </g>

    {/* 국기 게양대 */}
    <path d="M48 48V20" stroke="var(--text-faint)" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M48 22h11v6.5H48Z" fill="var(--brand)" stroke="var(--border-strong)" strokeWidth="1" />

    {/* 교실 창문 — 긴 정면에 4열 2층, 짧은 옆면에 1열 2층 */}
    <g fill="var(--solar)">
      <path d="M43.5 54.1 51.6 58.2 51.6 67.4 43.5 63.3Z" />
      <path d="M55.1 59.9 63.2 64 63.2 73.2 55.1 69.1Z" />
      <path d="M66.7 65.7 74.8 69.8 74.8 79 66.7 74.9Z" />
      <path d="M78.3 71.5 86.4 75.6 86.4 84.8 78.3 80.7Z" />
      <path d="M43.5 69.7 51.6 73.8 51.6 83 43.5 78.9Z" />
      <path d="M55.1 75.5 63.2 79.6 63.2 88.8 55.1 84.7Z" />
      <path d="M66.7 81.3 74.8 85.4 74.8 94.6 66.7 90.5Z" />
      <path d="M78.3 87.1 86.4 91.2 86.4 100.4 78.3 96.3Z" />
      <path d="M112 75.4 103 79.9 103 89.1 112 84.6Z" />
      <path d="M112 91 103 95.5 103 104.7 112 100.2Z" />
    </g>

    {/* 현관 차양과 출입구 */}
    <path d="M88.1 93.1 98 98 98 101.5 88.1 96.6Z" fill="var(--border-strong)" />
    <path d="M89.9 96.2 96.8 99.7 96.8 120.4 89.9 116.9Z" fill="var(--brand)" stroke="var(--border-strong)" strokeWidth="1.1" />

    {/* 계량기 — 벽에 붙여 단다. 발전량과 사용량을 따로 센다 */}
    <path d="M114.2 80.7 109.9 82.9 109.9 92.1 114.2 89.9Z" fill="var(--paper)" stroke="var(--border-strong)" strokeWidth="1.2" />
    <path d="M113 84.2 110.9 85.3M113 87 111.6 87.7" stroke="var(--text-faint)" strokeWidth="1.1" strokeLinecap="round" />

    {/* 학교에서 계통으로 나가는 전선 두 가닥. 그 위를 전기가 흘러간다 */}
    <g stroke="var(--ok)" strokeWidth="2.2" strokeLinecap="round" fill="none">
      <path d="M116 72q12 4 26 -28" />
      <path d="M116 80q14 6 28 -26" />
    </g>
    <g fill="var(--ok)">
      <circle className={styles.artWireA} r="3" />
      <circle className={styles.artWireA} style={delay(1.1)} r="3" />
      <circle className={styles.artWireB} style={delay(0.55)} r="3" />
      <circle className={styles.artWireB} style={delay(1.65)} r="3" />
    </g>
  </Base>
);

/**
 * 여정 단계 id 별 삽화.
 * `overview` 는 지금 이 순간의 값을 그림 위에 얹으므로 여기 두지 않고 호출부에서 따로 그린다.
 */
export const JOURNEY_ART: Record<string, ReactNode> = {
  sun: <SunlightArt />,
  panel: <PanelArt />,
  inverter: <InverterArt />,
  load: <GridArt />,
};
