import { CastShadow, SceneDefs } from './scene-art/SceneDefs';
import styles from './SolarEdu.module.scss';

interface GrowingTreeProps {
  /** 발전량 단계 0~4 */
  stage: 0 | 1 | 2 | 3 | 4;
  trees: number;
}

/** 나무가 딛고 선 자리. 자라는 것은 여기를 붙잡고 커진다 */
const GROUND = { x: 100, y: 192 };

/**
 * 다 자란 수관의 크기.
 * 세로보다 가로가 넓다 — 넓은 잎 나무는 위로 솟기보다 옆으로 퍼진다.
 */
const CROWN = { x: 100, y: 82, rx: 74, ry: 54 };

/**
 * 수관 윤곽을 이루는 잎 덩이 — 한 바퀴 도는 각도와 그 자리의 길이 비율.
 *
 * 각도를 고르게 벌리되 조금씩 어긋내고 길이도 달리한다. 완전히 고르면 톱니바퀴처럼 기계로 찍은
 * 모양이 된다. 아래 두 자리(76·104도)를 짧게 둔 것은 그쪽이 줄기와 만나 안으로 말려 들어가기
 * 때문이다.
 */
const BUMPS = [
  { deg: -90, k: 1 },
  { deg: -59, k: 0.95 },
  { deg: -36, k: 1 },
  { deg: -6, k: 0.94 },
  { deg: 21, k: 0.99 },
  { deg: 48, k: 0.93 },
  { deg: 76, k: 0.86 },
  { deg: 104, k: 0.86 },
  { deg: 132, k: 0.93 },
  { deg: 159, k: 0.99 },
  { deg: 186, k: 0.94 },
  { deg: 216, k: 1 },
  { deg: 239, k: 0.95 },
  { deg: 269, k: 0.99 },
];

/**
 * 잎 덩이를 이어 만든 닫힌 곡선.
 *
 * 점 사이를 자유 곡선으로 이으면 물결이 되어 잎이 아니라 구름이나 얼룩으로 보인다. 잎이 뭉쳐
 * 자란 나무의 윤곽은 **볼록한 덩이가 줄지어** 있고 그 사이만 살짝 파인 모양이다.
 *
 * 그래서 이웃한 두 점을 원호로 잇는다. 반지름을 두 점 사이 거리의 절반보다 크게(0.62배) 잡으면
 * 호가 바깥으로 부풀어 덩이 하나가 되고, 점과 점이 만나는 자리가 저절로 옅게 파인다.
 * 점을 시계 방향으로 돌리고 `sweep-flag` 를 1 로 두어야 부푸는 쪽이 바깥이 된다.
 */
function crownPath(): string {
  const points = BUMPS.map(({ deg, k }) => {
    const rad = (deg * Math.PI) / 180;

    return {
      x: CROWN.x + Math.cos(rad) * CROWN.rx * k,
      y: CROWN.y + Math.sin(rad) * CROWN.ry * k,
    };
  });

  const round = (value: number) => value.toFixed(1);
  let path = `M${round(points[0].x)} ${round(points[0].y)}`;

  for (let index = 1; index <= points.length; index += 1) {
    const prev = points[index - 1];
    const point = points[index % points.length];
    const chord = Math.hypot(point.x - prev.x, point.y - prev.y);
    const radius = round(chord * 0.62);

    path += `A${radius} ${radius} 0 0 1 ${round(point.x)} ${round(point.y)}`;
  }

  return `${path}Z`;
}

/**
 * 밑동이 벌어지고 위에서 갈라지는 줄기.
 *
 * 곧은 막대는 나무가 아니라 기둥이다. 아래로 갈수록 뿌리가 갈라지며 땅을 붙잡고, 위에서는
 * 두 갈래로 나뉘어 잎 속으로 들어간다 — 이 두 가지가 있어야 굵은 줄기가 나무 줄기로 읽힌다.
 */
const TRUNK = 'M62 192'
  + 'C70 168 82 154 84 134'
  + 'C85 124 84 118 82 111'
  + 'L95 124L101 108L109 125L119 110'
  + 'C117 118 116 124 117 134'
  + 'C119 154 131 168 139 192'
  + 'C132 187 126 185 121 191'
  + 'C116 184 110 183 105 191'
  + 'C100 184 95 184 90 191'
  + 'C85 184 79 185 74 191'
  + 'C70 188 66 189 62 192Z';

/** 왼쪽으로 도는 면 — 같은 줄기에 밝은 쪽을 만들어 둥글게 보이게 한다 */
const TRUNK_LIT = 'M62 192'
  + 'C70 168 82 154 84 134'
  + 'C85 124 84 118 82 111'
  + 'L92 121'
  + 'C93 128 92 132 93 140'
  + 'C93 160 82 174 76 190'
  + 'C70 188 66 189 62 192Z';

/**
 * 단계마다 다 자란 크기의 몇 할인지.
 * 첫 단계도 절반은 되어야 나무로 보인다 — 너무 작으면 묘목이 아니라 점이 된다.
 */
const GROWTH = [0, 0.56, 0.71, 0.86, 1] as const;

/**
 * 발전량에 따라 자라는 나무 (SFR-005-05/06).
 *
 * 뒤에 다 자란 크기를 점선으로 세워 두고 그 안에서 나무가 자란다. **안내선과 수관이 같은 도형**
 * 이라 어느 단계에서도 모양이 어긋나지 않는다 — 다 자라면 수관이 점선에 정확히 겹치고,
 * 덜 자랐으면 그 사이의 빈 자리가 "이만큼 더 자랄 수 있다" 를 말한다.
 *
 * 잎에는 결을 그리지 않는다. 줄을 그으면 긁힌 자국이 되고 얼룩을 얹으면 때가 탄 것처럼 보인다.
 * 빛이 왼쪽 위에서 들어 오른쪽 아래가 잠기는 한 겹이면 잎 덩이의 부피는 충분히 선다 —
 * 울퉁불퉁한 테두리가 이미 "잎이 뭉쳐 있다" 를 말하고 있기 때문이다.
 *
 * 단계 변화는 애니메이션이 아니라 그리는 것 자체로 표현한다 — rAF 없이도 값이 바뀌면 바로 반영된다.
 * 흔들리는 것만 CSS 애니메이션이라, 걸어 두는 화면에서 문서가 가려져도 계속 돈다.
 */
export function GrowingTree({ stage, trees }: GrowingTreeProps) {
  const scale = GROWTH[stage];
  const crown = crownPath();
  const clipId = `tree-crown-${stage}`;

  return (
    <svg
      className={styles.tree}
      /*
        다 자란 나무에 딱 맞춘 창 (2026-09-07 지시 — 나무가 너무 작다).

        200x200 안에서 그림이 실제로 차지하는 것은 (25, 23)~(175, 200.6) 뿐이라, 좌우 25씩과
        위 23이 늘 빈 채로 자리를 먹었다. 칸이 주는 높이는 정해져 있으므로 그 여백을 걷어 내는
        것이 곧 그림을 키우는 일이다.

        기준은 **다 자란** 크기다. 단계마다 창을 다시 맞추면 어린 나무도 화면을 꽉 채워, 자라는
        것이 보이지 않는다.
      */
      viewBox="22 20 156 184"
      fill="none"
      role="img"
      aria-label={`금일 발전량을 소나무 ${trees}그루로 환산했다. 자란 정도는 4단계 중 ${stage}단계다.`}
    >
      <SceneDefs />

      <defs>
        {/*
          수관에 드는 빛.

          왼쪽 위에서 오른쪽 아래로 한 방향으로만 흐른다 — 얼룩을 여기저기 얹으면 잎이 아니라
          때가 탄 것처럼 보인다. 빛은 한 곳에서 오고, 그 반대편이 잠긴다. 그게 전부다.
        */}
        <linearGradient id="tree-light" x1="0.18" y1="0" x2="0.86" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="0.62" stopColor="#0b1524" stopOpacity="0.04" />
          <stop offset="1" stopColor="#0b1524" stopOpacity="0.22" />
        </linearGradient>

        {/* 명암은 수관 안에서만 — 밖으로 새면 안개가 낀 것처럼 보인다 */}
        <clipPath id={clipId}>
          <path d={crown} />
        </clipPath>
      </defs>

      {/*
        다 자란 크기.
        수관과 같은 도형이라 단계가 어떻든 모양이 어긋나지 않는다. 안쪽 나무와의 빈 자리가
        곧 "앞으로 이만큼 더" 이므로, 다 자란 날에는 이 선이 수관에 덮여 보이지 않는다.
      */}
      <path className={styles.tree__guide} d={crown} />

      {/* 자람 — 땅을 딛고 나무 전체가 커진다. 크기는 속성으로 주고 흔들림은 안쪽에서 CSS 로 준다 */}
      <g transform={`translate(${GROUND.x} ${GROUND.y}) scale(${scale}) translate(${-GROUND.x} ${-GROUND.y})`}>
        <CastShadow cx={100} cy={192} rx={62} ry={10} />

        {stage > 0 ? (
          <g className={styles.tree__sway}>
            <path className={styles.tree__rim} d={crown} />
            <path d={crown} fill="var(--ok)" />

            {/* 왼쪽 위에서 오른쪽 아래로 흐르는 빛 한 겹 */}
            <path d={crown} fill="url(#tree-light)" clipPath={`url(#${clipId})`} />
          </g>
        ) : null}

        {/*
          줄기는 수관 **위에** 그린다.
          잎 사이로 갈라진 줄기가 비쳐야 잎이 줄기 뒤로도 돌아가 있는 것으로 읽힌다 —
          뒤에 감추면 초록 덩이가 막대 위에 얹힌 모양이 된다.
        */}
        <path className={styles.tree__trunk} d={TRUNK} />
        <path className={styles.tree__lit} d={TRUNK_LIT} />
        <path className={styles.tree__bark} d="M97 176c-2-16 1-28 2-42M108 168c1-14-1-24-2-34" />
      </g>
    </svg>
  );
}
