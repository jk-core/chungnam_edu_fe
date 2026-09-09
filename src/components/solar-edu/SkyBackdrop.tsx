import { cn } from '@/utils/cn';
import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import type { WeatherKind } from '@/interface/weather';
import { scatterDrops, WEATHER_SKY } from './weatherSky';
import styles from './SolarEdu.module.scss';
import type { CSSProperties } from 'react';

/**
 * 하루의 하늘 빛깔.
 * 새벽·아침·낮·저녁·밤을 나눠, 화면 전체 색이 지금 시각을 먼저 알려 주게 한다.
 */
const SKIES = [
  { id: 'dawn', until: SUNRISE_HOUR + 1, top: '#f8c9a0', bottom: '#fde8cf' },
  { id: 'morning', until: 11, top: '#8fc6ef', bottom: '#dcefff' },
  { id: 'noon', until: 15, top: '#5aa8e8', bottom: '#d6ecff' },
  { id: 'evening', until: SUNSET_HOUR, top: '#f3a97a', bottom: '#ffe2c4' },
  { id: 'night', until: 24, top: '#4a5b86', bottom: '#8ea3c8' },
];

/** 천천히 흐르는 구름 — 위치와 크기를 흩어 두어 같은 모양이 반복돼 보이지 않게 한다. */
const CLOUDS = [
  { id: 'a', top: '12%', scale: 1, delay: '0s', duration: '68s' },
  { id: 'b', top: '30%', scale: 0.7, delay: '-22s', duration: '92s' },
  { id: 'c', top: '52%', scale: 1.25, delay: '-48s', duration: '78s' },
  { id: 'd', top: '6%', scale: 0.85, delay: '-64s', duration: '86s' },
  { id: 'e', top: '40%', scale: 1.1, delay: '-12s', duration: '74s' },
];

/* 하늘이 넓게 드러나는 판이라 촘촘히 뿌린다 — 성글면 비가 아니라 점으로 보인다 */
const DROPS = scatterDrops(20);

interface SkyBackdropProps {
  /** 지금 시각(소수 시간) — 하늘 색과 해의 높이를 정한다 */
  nowHour: number;
  /** 지금 날씨 — 해와 구름과 내리는 것을 정한다 */
  kind: WeatherKind;
}

/**
 * 초등 판 배경 (SFR-005-06).
 *
 * 카드 뒤에 하늘을 깔아 화면 전체가 하나의 그림이 되게 한다. 해는 시각에 따라 궤도를 따라 오르내리고,
 * 구름은 천천히 흘러간다 — 아무도 조작하지 않아도 화면이 살아 있게 하는 몫이다.
 */
export function SkyBackdrop({ nowHour, kind }: SkyBackdropProps) {
  const sky = SKIES.find((item) => nowHour < item.until) ?? SKIES[SKIES.length - 1];
  // 해가 뜬 동안만 궤도를 그린다. 0 이면 왼쪽 지평선, 1 이면 오른쪽 지평선이다.
  const progress = Math.min(1, Math.max(0, (nowHour - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR)));
  const isDay = nowHour > SUNRISE_HOUR && nowHour < SUNSET_HOUR;
  const weather = WEATHER_SKY[kind];

  return (
    <div
      className={styles.sky}
      style={{ background: `linear-gradient(180deg, ${sky.top} 0%, ${sky.bottom} 100%)` }}
      aria-hidden="true"
    >
      {/* 흐린 날일수록 하늘 위에 잿빛을 한 겹 덮는다 — 색을 갈아 끼우지 않고 섞는다 */}
      {weather.gray > 0 ? (
        <span
          className={styles.sky__haze}
          style={{
            opacity: weather.gray,
            '--haze-top': weather.haze[0],
            '--haze-bottom': weather.haze[1],
          } as CSSProperties}
        />
      ) : null}

      {isDay && weather.sun !== 'none' ? (
        <span
          className={cn(styles.sky__sun, { [styles['sky__sun--veiled']]: weather.sun === 'veiled' })}
          style={{
            left: `${8 + progress * 84}%`,
            // 정오에 가장 높이 뜬다 — 반원 궤도를 사인으로 그린다.
            top: `${52 - Math.sin(Math.PI * progress) * 40}%`,
          }}
        />
      ) : null}

      {weather.drops ? (
        <span className={styles.sky__fall}>
          {DROPS.map((drop) => (
            <span
              key={drop.id}
              className={cn(styles.drop, { [styles['drop--snow']]: weather.drops === 'snow' })}
              style={{ left: drop.left, animationDelay: drop.delay, animationDuration: drop.duration }}
            />
          ))}
        </span>
      ) : null}

      {CLOUDS.slice(0, weather.clouds).map((cloud) => (
        <span
          key={cloud.id}
          className={styles.sky__cloud}
          style={{
            top: cloud.top,
            transform: `scale(${cloud.scale})`,
            animationDelay: cloud.delay,
            animationDuration: cloud.duration,
          }}
        />
      ))}

      {/* 아래쪽 언덕 — 카드가 땅 위에 놓인 것처럼 보이게 한다 */}
      <svg className={styles.sky__ground} viewBox="0 0 1200 160" preserveAspectRatio="none">
        <path d="M0 96 C 180 52 340 118 520 92 C 700 66 860 116 1040 88 C 1120 76 1170 82 1200 78 L1200 160 L0 160 Z" />
      </svg>
    </div>
  );
}
