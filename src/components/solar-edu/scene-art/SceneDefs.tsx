/*
  교육용 그림이 나눠 쓰는 명암 정의.

  도형을 색 하나로 칠하면 아무리 잘 그려도 종이에 오린 것처럼 납작하다. 빛이 위에서 온다고 정해 두고
  같은 면에 **밝음과 어둠을 겹쳐** 올리면 두께가 생긴다. 색은 토큰이 맡고 여기서는 명암만 얹으므로,
  어느 테마에서도 색이 어긋나지 않는다.

  같은 화면에 그림이 둘 이상 뜨면 id 가 겹치지만, 정의가 똑같아 어느 쪽을 참조하든 결과가 같다.
*/
export function SceneDefs() {
  return (
    <defs>
      {/* 위에서 내려오는 빛 — 면의 윗머리를 밝힌다 */}
      <linearGradient id="edu-shine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0.12" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>

      {/* 그 반대편 — 면의 아랫도리를 눌러 앉힌다 */}
      <linearGradient id="edu-shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0b1524" stopOpacity="0" />
        <stop offset="1" stopColor="#0b1524" stopOpacity="0.3" />
      </linearGradient>

      {/* 옆으로 도는 면 — 정면보다 한 단계 어둡다 */}
      <linearGradient id="edu-side" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#0b1524" stopOpacity="0.34" />
        <stop offset="1" stopColor="#0b1524" stopOpacity="0.16" />
      </linearGradient>

      {/* 공처럼 부푼 것 — 왼쪽 위가 밝고 가장자리로 갈수록 잠긴다 */}
      <radialGradient id="edu-orb" cx="0.34" cy="0.28" r="0.78">
        <stop offset="0" stopColor="#fff" stopOpacity="0.8" />
        <stop offset="0.45" stopColor="#fff" stopOpacity="0.14" />
        <stop offset="0.82" stopColor="#0b1524" stopOpacity="0.06" />
        <stop offset="1" stopColor="#0b1524" stopOpacity="0.26" />
      </radialGradient>

      {/* 유리에 비친 하늘 — 태양광 판을 유리로 보이게 하는 한 줄기 */}
      <linearGradient id="edu-glass" x1="0" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.42" />
        <stop offset="0.38" stopColor="#fff" stopOpacity="0.06" />
        <stop offset="0.62" stopColor="#fff" stopOpacity="0.22" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>

      {/* 바닥에 지는 그림자 — 가운데가 짙고 가장자리로 풀린다 */}
      <radialGradient id="edu-cast" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#0b1524" stopOpacity="0.26" />
        <stop offset="0.7" stopColor="#0b1524" stopOpacity="0.08" />
        <stop offset="1" stopColor="#0b1524" stopOpacity="0" />
      </radialGradient>

      {/* 물체를 바닥에서 살짝 띄우는 그늘 */}
      <filter id="edu-lift" x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#0b1524" floodOpacity="0.18" />
      </filter>
    </defs>
  );
}

/** 바닥 그림자 하나. 물체 밑에 깔면 공중에 뜬 느낌이 사라진다 */
export function CastShadow({ cx, cy, rx, ry = rx * 0.24 }: { cx: number; cy: number; rx: number; ry?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#edu-cast)" />;
}
