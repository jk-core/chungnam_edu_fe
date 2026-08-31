import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import styles from './QuietBackdrop.module.scss';

interface QuietBackdropProps {
  /** 지금 시각(소수 시간) — 해의 자리를 정한다 */
  nowHour: number;
}

/**
 * 시안 C 의 중·고등 배경 (SFR-005-06).
 *
 * 초등 배경(`SkyBackdrop`)이 구름이 흐르는 그림 하늘이라면, 이쪽은 **뒤로 물러난 하늘**이다.
 * 카드 뒤에 옅은 하늘과 학교 능선을 깔아 화면이 흰 종이로 남지 않게 하되, 읽을 것이 카드
 * 위에 있으므로 배경이 눈을 끌지는 않게 한다.
 *
 * 색을 값으로 박지 않고 토큰으로만 그린다. 초등 배경은 그림이 주인공이라 밝은 하늘을 못 박고
 * 그 위 글자색까지 고정하는데, 여기서는 카드가 주인공이므로 화면 모드를 그대로 따르는 편이 맞다 —
 * 어두운 모드에서 이 판만 홀로 밝으면 다른 시안과 나란히 놓고 고를 수가 없다.
 *
 * 해는 시각을 따라 옮겨 앉는다. 아무도 조작하지 않는 화면이라 어딘가는 살아 있어야 하는데,
 * 카드가 조용한 판이라 그 몫을 배경이 맡는다.
 */
export function QuietBackdrop({ nowHour }: QuietBackdropProps) {
  const progress = Math.min(1, Math.max(0, (nowHour - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR)));
  const isDay = nowHour > SUNRISE_HOUR && nowHour < SUNSET_HOUR;

  return (
    <div className={styles.quiet} aria-hidden="true">
      {isDay ? (
        <span
          className={styles.quiet__sun}
          style={{
            left: `${10 + progress * 80}%`,
            // 정오에 가장 높이 뜬다 — 반원 궤도를 사인으로 그린다
            top: `${44 - Math.sin(Math.PI * progress) * 30}%`,
          }}
        />
      ) : null}

      {/*
        아래를 받치는 능선과 지붕.
        선 하나로 「여기가 학교 지붕 위」 라는 것만 말하고 물러난다 — 형태를 알아보게 그리면
        카드 뒤에서 두 그림이 겹쳐 읽힌다.
      */}
      <svg className={styles.quiet__ground} viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          className={styles.quiet__hill}
          d="M0 128 C 190 92 350 150 540 124 C 720 100 880 148 1060 120 C 1130 110 1170 114 1200 110 L1200 200 L0 200 Z"
        />
        <path
          className={styles.quiet__roof}
          d="M120 152 L232 118 L344 152 M420 146 L532 112 L644 146 M720 152 L832 118 L944 152"
        />
      </svg>
    </div>
  );
}
