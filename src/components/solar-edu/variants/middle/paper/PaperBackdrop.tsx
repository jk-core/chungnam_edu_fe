import type { EduLevel } from '@/interface/edu';
import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import type { WeatherKind } from '@/interface/weather';
import { scatterDrops, WEATHER_SKY } from '@/components/solar-edu/weatherSky';
import styles from './PaperBackdrop.module.scss';
import type { CSSProperties } from 'react';

interface PaperBackdropProps {
  /** 지금 몇 시인지 (소수 시간). 해가 앉는 자리를 정한다. */
  nowHour: number;
  /** 누구 눈높이인지. 하늘의 결이 눈높이를 따라 달라진다. */
  level: EduLevel;
  /** 지금 날씨. 해와 구름과 내리는 것, 그리고 하늘에 얹는 잿빛을 정한다. */
  kind: WeatherKind;
}

/** 구름 한 덩이의 윤곽. 둥근 봉우리 넷을 이어 붙여 가장자리가 매끈하다. */
const CLOUD = 'M8 34c-9 0-9-12 1-13 0-10 13-13 18-6 3-9 16-9 19 0 9-4 17 2 16 10 9 1 9 9 0 9z';

/**
 * 하늘에 뜨는 구름 덩이 수 — 눈높이와 날씨가 함께 정한다 (2026-09-09 지시).
 *
 * 고등의 맑은 날이 0 인 것은 실수가 아니다. 「하늘을 비워 자료를 앞에 둔다」 가 이 눈높이의
 * 설계이므로 그 뜻을 **맑은 날의 몫으로 남긴다.** 다만 비 오는 날까지 빈 하늘이면 배경이
 * 거짓을 말하게 되므로, 흐린 날에만 최소한을 띄우고 나머지는 잿빛과 빗줄기가 말한다.
 *
 * 이 판은 하늘이 지면 뒤로 물러나 있어 `SkyBackdrop` 보다 한 단씩 적다 — 거기서는 하늘이
 * 화면의 주인이고, 여기서는 글이 주인이다.
 */
const CLOUD_COUNT: Record<EduLevel, Record<WeatherKind, number>> = {
  elementary: { clear: 2, partlyCloudy: 3, cloudy: 5, rain: 5, snow: 5 },
  middle: { clear: 1, partlyCloudy: 2, cloudy: 4, rain: 4, snow: 4 },
  high: { clear: 0, partlyCloudy: 0, cloudy: 2, rain: 2, snow: 2 },
};

/* 배경이 글 뒤로 물러나야 하는 판이라 성글게 뿌린다 — 촘촘하면 글 위에서 빗줄기가 읽힌다 */
const DROPS = scatterDrops(14);

/**
 * 시안 E 의 배경 (SFR-005-06).
 *
 * 여러 겹을 쌓아 깊이를 만든다 — 하늘, 떠 있는 빛기둥, 시각을 따라 건너가는 빛, 흐르는 구름,
 * 그리고 멀리 물러난 능선 세 겹이다. 뒤로 갈수록 옅고 느리게 움직여 가까운 것과 먼 것이 갈린다.
 *
 * 어느 겹도 형태를 갖지 않는다. 학교와 태양광 어레이, 그리고 해의 원반과 빛살까지 그려 넣어
 * 보았으나 모두 걷어냈다 (2026-09-01) — 배경에서 형태를 갖춘 것은 눈을 끌어 글보다 먼저
 * 읽히고, 잔선은 본문과 같은 자리에서 부딪힌다. 배경이 앞에 나서면 배경을 깐 뜻이 없다.
 *
 * 눈높이가 하늘의 결을 가른다. 초등은 구름이 많고 해가 크며, 고등은 하늘을 비우고
 * 대신 옅은 눈금선을 깔아 **자료를 읽는 자리**라는 것을 배경이 먼저 말한다.
 *
 * 날씨도 함께 읽는다 (2026-09-09 지시). 시각만 보던 배경이라 비 오는 날에도 해가 건너갔다 —
 * 상황판의 값어치는 실시간성이고, 창밖과 어긋나는 화면은 옆에 적힌 수치까지 의심하게 만든다.
 * 규칙은 `SkyBackdrop` 과 같은 표(`WEATHER_SKY`)를 읽되, 짙기만 이 판에 맞춰 낮춘다.
 *
 * 색은 값으로 박지 않고 토큰만 섞어 쓴다. 그래야 어두운 모드에서 같은 그림이 밤 풍경이 된다.
 */
export function PaperBackdrop({ nowHour, level, kind }: PaperBackdropProps) {
  const weather = WEATHER_SKY[kind];

  /*
    해는 뜬 시각부터 진 시각까지 왼쪽에서 오른쪽으로 건너간다.
    밤에는 양 끝에 붙어 옅어진다 — 지지 않는 해를 그려 두면 시각을 읽는 다른 값들과 어긋난다.
  */
  const span = (nowHour - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR);
  const daylight = Math.max(0, Math.min(1, span));
  const x = 10 + daylight * 80;

  /* 해는 위쪽 띠 안에서만 오르내린다 — 더 내려오면 번짐이 본문 글 위에 앉는다 */
  const y = 20 - Math.sin(daylight * Math.PI) * 14;
  const isDay = span > 0 && span < 1;

  /*
    해를 얼마나 가릴지.

    `opacity` 로 낮추지 않는다 — 이 요소는 숨을 쉬듯 짙기가 오르내리는 애니메이션을 달고 있어,
    애니메이션이 인라인 `opacity` 를 덮어쓴다(그래서 밤에도 해가 그대로 밝았다).
    애니메이션이 건드리지 않는 `filter` 로 걸면 둘이 겹쳐 먹는다.
  */
  const sunVeil = (isDay ? 1 : 0.22) * (weather.sun === 'veiled' ? 0.5 : 1);
  const clouds = CLOUD_COUNT[level][kind];

  return (
    <div className={styles.backdrop} data-level={level} aria-hidden="true">
      {/* 가장 뒤 — 아주 크고 옅은 빛기둥 둘. 서로 다른 속도로 떠 하늘이 굳지 않게 한다 */}
      <span className={styles.orb} data-orb="1" />
      <span className={styles.orb} data-orb="2" />

      {/* 흐릴수록 하늘 위에 잿빛을 한 겹 덮는다 — 색을 갈아 끼우지 않고 섞는다 */}
      {weather.gray > 0 && (
        <span
          className={styles.haze}
          style={{
            /*
              짙기는 여기서 정하지 않고 날씨가 정한 값만 넘긴다.

              같은 잿빛이라도 밝은 바탕에서는 글을 씻어 내고 어두운 바탕에서는 좀처럼 보이지
              않아, 얼마나 얹을지는 테마가 정해야 한다. 날씨끼리의 **차이**만 여기서 지운다.
            */
            '--haze-gray': weather.gray,
            '--haze-top': weather.haze[0],
            '--haze-bottom': weather.haze[1],
          } as CSSProperties}
        />
      )}

      {/*
        해. 원반과 빛살까지 그려 보았으나 걷어냈다 (2026-09-01) — 배경에서 형태를 갖추면
        그것이 눈을 끌어 글보다 먼저 읽힌다. 여기에 필요한 것은 「빛이 퍼지는 자리」 하나뿐이다.
        비·눈이 오는 날에는 아예 두지 않는다.
      */}
      {weather.sun !== 'none' && (
        <span
          className={styles.sun}
          style={{ left: `${x}%`, top: `${y}%`, '--sun-veil': sunVeil } as CSSProperties}
        />
      )}

      {clouds > 0 && (
        <svg className={styles.clouds} viewBox="0 0 1200 200" preserveAspectRatio="xMidYMin slice">
          {Array.from({ length: clouds }, (_, index) => (
            <g key={index} className={styles.cloud} data-cloud={index + 1}>
              <path d={CLOUD} />
            </g>
          ))}
        </svg>
      )}

      {/*
        내리는 것.

        하늘이 넓게 드러나는 판보다 가늘고 성글다. 이 판에서 빗줄기는 글 위를 지나므로,
        「비가 온다」 를 알릴 만큼만 있고 읽는 것을 방해하지 않을 만큼은 없어야 한다.
      */}
      {weather.drops && (
        <span className={styles.fall} data-kind={weather.drops}>
          {DROPS.map((drop) => (
            <span
              key={drop.id}
              className={styles.drop}
              style={{ left: drop.left, animationDelay: drop.delay, animationDuration: drop.duration }}
            />
          ))}
        </span>
      )}

      {/* 고등만 — 하늘 대신 옅은 눈금선. 자료를 읽는 자리라는 것을 배경이 먼저 말한다 */}
      {level === 'high' && (
        <svg className={styles.rules} viewBox="0 0 100 100" preserveAspectRatio="none">
          {[18, 34, 50, 66, 82].map((line) => (
            <line key={line} x1="0" y1={line} x2="100" y2={line} />
          ))}
        </svg>
      )}

      {/*
        능선 세 겹.

        학교와 태양광 어레이를 그려 넣어 보았으나 걷어냈다 (2026-09-01) — 창과 격자 같은 잔선이
        본문 글과 같은 자리에서 부딪혀 글이 읽히지 않았다. 배경이 앞에 나서면 배경을 깐 뜻이 없다.
        형태가 없는 능선만 남기면 그 위에 글이 얹혀도 서로 방해하지 않는다.
      */}
      <svg className={styles.scene} viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice">
        <path className={styles.scene__far} d="M0 300V150c170-46 300 18 470-8s280-64 430-36 220 50 300 34v160z" />
        <path className={styles.scene__mid} d="M0 300V196c150-34 250 20 400-2s260-58 430-34 250 48 370 30v110z" />
        <path className={styles.scene__near} d="M0 300V244c170-26 280 14 440-4s250-44 400-24 260 36 360 22v62z" />
      </svg>
    </div>
  );
}
