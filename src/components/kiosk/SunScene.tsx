import { WEATHER_META } from '@/mocks/weather';
import { cn } from '@/utils/cn';
import type { WeatherKind } from '@/interface/weather';
import styles from './Kiosk.module.scss';

interface SunSceneProps {
  weather: WeatherKind;
  /** 지금 햇빛 세기 0~1 */
  intensity: number;
}

/**
 * 해·구름·태양광 패널 장면 (SFR-005-06).
 * 미리보기 환경에서 rAF 가 돌지 않아 전부 CSS 키프레임으로 움직인다.
 */
export function SunScene({ weather, intensity }: SunSceneProps) {
  const cloudCount = weather === 'clear' ? 1 : weather === 'partlyCloudy' ? 2 : 3;
  const isProducing = intensity > 0.05;

  return (
    <div className={styles.scene}>
      <svg
        className={styles.scene__svg}
        viewBox="0 0 800 350"
        role="img"
        aria-label={`오늘 날씨 ${WEATHER_META[weather].label}, 햇빛 세기 ${Math.round(intensity * 100)}%`}
      >
        {/* 해 — 세기에 따라 위로 올라온다 */}
        <g transform={`translate(640 ${118 - intensity * 34})`}>
          <circle className={styles.sun__glow} r={62} />
          <g>
            {Array.from({ length: 8 }, (_, index) => {
              const angle = (index * Math.PI) / 4;

              return (
                <line
                  key={index}
                  className={styles.sun__ray}
                  x1={Math.cos(angle) * 40}
                  y1={Math.sin(angle) * 40}
                  x2={Math.cos(angle) * 52}
                  y2={Math.sin(angle) * 52}
                  opacity={0.3 + intensity * 0.6}
                />
              );
            })}
          </g>
          <circle className={styles.sun} r={30} />
        </g>

        {/* 구름 — 날씨가 흐릴수록 많다.
            위치 지정과 애니메이션은 다른 그룹에 나눈다. 한 요소에 겹치면 CSS transform 이 속성을 덮어써 제자리로 몰린다. */}
        {Array.from({ length: cloudCount }, (_, index) => (
          <g key={index} transform={`translate(${132 + index * 196} ${86 + index * 30}) scale(${1 - index * 0.14})`}>
            <g className={cn(styles.cloud, index % 2 === 0 ? styles['cloud--a'] : styles['cloud--b'])}>
              <ellipse cx="0" cy="0" rx="46" ry="22" />
              <ellipse cx="34" cy="6" rx="34" ry="17" />
              <ellipse cx="-32" cy="7" rx="30" ry="15" />
            </g>
          </g>
        ))}

        {/* 지면 */}
        <path className={styles.ground} d="M0 292h800v58H0z" opacity="0.4" />

        {/* 태양광 패널 두 장 */}
        {[190, 400].map((x, index) => (
          <g key={x} transform={`translate(${x} 214) scale(${1 - index * 0.08})`}>
            <path className={styles.panel__leg} d="M40 74v22M118 74v22" />
            <g transform="skewX(-14)">
              <rect className={styles.panel__frame} x="14" y="6" width="140" height="72" rx="5" />
              <rect className={styles.panel__glass} x="19" y="11" width="130" height="62" rx="3" />
              <path
                className={styles.panel__grid}
                d="M19 32h130M19 52h130M62 11v62M105 11v62"
              />
              {isProducing ? (
                <rect className={styles.panel__shine} x="19" y="11" width="130" height="62" rx="3" />
              ) : null}
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
