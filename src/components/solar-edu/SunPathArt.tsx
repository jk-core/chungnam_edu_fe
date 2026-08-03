import { NOW_HOUR } from '@/mocks/today';
import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import styles from './SolarEdu.module.scss';
import type { SVGProps } from 'react';

/**
 * 해가 도는 궤도. 타원이 아니라 정원의 반원으로 잡은 데는 이유가 있다 —
 * 해와 빛다발을 한 그룹에 담아 `rotate` 하나로 돌리면, 빛다발이 늘 해에서 모듈을 향한다.
 * 타원이면 각도를 따로 계산해 맞춰야 한다.
 */
const ORBIT = { cx: 130, cy: 96, r: 78 };

/** 지금이 하루의 어디쯤인지 (0 = 일출, 1 = 일몰) */
const dayProgress = Math.min(1, Math.max(0, (NOW_HOUR - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR)));

/** 궤도 위의 한 점. 각도는 일출(180°)에서 일몰(0°)로 줄어든다. */
function orbitPoint(progress: number) {
  const radian = Math.PI * (1 - progress);

  return {
    x: ORBIT.cx + ORBIT.r * Math.cos(radian),
    y: ORBIT.cy - ORBIT.r * Math.sin(radian),
  };
}

/** 소수 시간(5.5)을 시계 표기(05:30)로 바꾼다. */
export function clockOf(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const now = orbitPoint(dayProgress);

/**
 * 해가 하루 동안 그리는 길 (SFR-005-03).
 *
 * 옆에 붙은 해설 석 장이 말로 하는 것을 그림 하나가 대신한다 —
 * 해가 높이 뜨면 빛다발이 모듈에 수직으로 좁게 꽂히고(남중고도),
 * 낮게 뜨면 비스듬히 누워 대기층을 길게 지난다(대기 통과).
 */
export function SunPathArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 260 120"
      width="100%"
      height="100%"
      fill="none"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      {/* 대기층 — 빛다발이 누울수록 이 층을 길게 가로지른다 */}
      <g stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4">
        <path d="M18 44h224M18 62h224M18 80h224" />
      </g>

      {/* 해가 지나는 길 */}
      <path
        d={`M${ORBIT.cx - ORBIT.r} ${ORBIT.cy}A${ORBIT.r} ${ORBIT.r} 0 0 1 ${ORBIT.cx + ORBIT.r} ${ORBIT.cy}`}
        stroke="var(--border-strong)"
        strokeWidth="1.2"
        strokeDasharray="3 5"
      />

      {/* 지금 시각 표식 — 해는 계속 돌므로 지금이 어디인지는 따로 박아 둔다 */}
      <circle cx={now.x} cy={now.y} r="5.5" stroke="var(--solar-deep)" strokeWidth="1.6" strokeDasharray="2.6 2.4" />
      <text
        x={now.x}
        y={now.y - 11}
        fill="var(--solar-deep)"
        fontSize="9"
        textAnchor="middle"
        fontFamily="Space Grotesk, sans-serif"
      >
        {`지금 ${clockOf(NOW_HOUR)}`}
      </text>

      {/*
        해와 빛다발을 함께 태운 회전 그룹.
        해는 궤도 왼쪽 끝(일출 자리)에 두고, 빛다발은 거기서 회전 중심을 향해 뻗는다.
        그룹이 돌면 둘이 같이 돌아 빛다발이 늘 해에서 모듈로 향한다.
      */}
      <g className={styles.sunOrbit}>
        <path
          d={`M${ORBIT.cx - ORBIT.r} ${ORBIT.cy - 13}L${ORBIT.cx} ${ORBIT.cy - 4}L${ORBIT.cx} ${ORBIT.cy + 4}L${ORBIT.cx - ORBIT.r} ${ORBIT.cy + 13}Z`}
          fill="var(--solar)"
          fillOpacity="0.34"
        />
        <circle cx={ORBIT.cx - ORBIT.r} cy={ORBIT.cy} r="17" fill="var(--solar)" fillOpacity="0.18" />
        <circle
          cx={ORBIT.cx - ORBIT.r}
          cy={ORBIT.cy}
          r="11"
          fill="var(--solar)"
          stroke="var(--solar-deep)"
          strokeWidth="1.4"
        />
        <g
          className={styles.sunOrbit__rays}
          stroke="var(--solar-deep)"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path
            d={`M${ORBIT.cx - ORBIT.r} ${ORBIT.cy - 20}v5M${ORBIT.cx - ORBIT.r} ${ORBIT.cy + 15}v5M${ORBIT.cx - ORBIT.r - 20} ${ORBIT.cy}h5M${ORBIT.cx - ORBIT.r + 15} ${ORBIT.cy}h5`}
          />
          <path
            d={`M${ORBIT.cx - ORBIT.r - 14} ${ORBIT.cy - 14}l3.5 3.5M${ORBIT.cx - ORBIT.r + 10.5} ${ORBIT.cy + 10.5}l3.5 3.5M${ORBIT.cx - ORBIT.r - 14} ${ORBIT.cy + 14}l3.5-3.5M${ORBIT.cx - ORBIT.r + 10.5} ${ORBIT.cy - 10.5}l3.5-3.5`}
          />
        </g>
      </g>

      {/* 지면과 모듈 — 빛다발이 모이는 자리 */}
      <path d="M18 96h224" stroke="var(--ok)" strokeOpacity="0.5" strokeWidth="1.4" />
      <path d="M18 96h224v18H18Z" fill="var(--ok-soft)" />
      <path d="M112 96 126 84h14l-8 12Z" fill="var(--brand)" stroke="var(--brand-contrast)" strokeWidth="1.2" />
      <path d="M130 96v8M122 104h16" stroke="var(--text-faint)" strokeWidth="1.6" strokeLinecap="round" />

      {/* 궤도 양 끝 — 오늘의 일출·일몰 */}
      <text x="34" y="110" fill="var(--text-faint)" fontSize="9" fontFamily="Space Grotesk, sans-serif">
        {`일출 ${clockOf(SUNRISE_HOUR)}`}
      </text>
      <text
        x="226"
        y="110"
        fill="var(--text-faint)"
        fontSize="9"
        textAnchor="end"
        fontFamily="Space Grotesk, sans-serif"
      >
        {`일몰 ${clockOf(SUNSET_HOUR)}`}
      </text>
    </svg>
  );
}
