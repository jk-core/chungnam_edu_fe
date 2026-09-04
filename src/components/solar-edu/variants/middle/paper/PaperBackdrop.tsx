import type { EduLevel } from '@/interface/edu';
import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import styles from './PaperBackdrop.module.scss';

interface PaperBackdropProps {
  /** 지금 몇 시인지 (소수 시간). 해가 앉는 자리를 정한다. */
  nowHour: number;
  /** 누구 눈높이인지. 하늘의 결이 눈높이를 따라 달라진다. */
  level: EduLevel;
}

/** 구름 한 덩이의 윤곽. 둥근 봉우리 넷을 이어 붙여 가장자리가 매끈하다. */
const CLOUD = 'M8 34c-9 0-9-12 1-13 0-10 13-13 18-6 3-9 16-9 19 0 9-4 17 2 16 10 9 1 9 9 0 9z';

/** 눈높이마다 구름이 몇 덩이 뜨는지. 고등은 하늘을 비워 자료가 앞에 오게 한다. */
const CLOUD_COUNT: Record<EduLevel, number> = {
  elementary: 3,
  middle: 2,
  high: 0,
};

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
 * 색은 값으로 박지 않고 토큰만 섞어 쓴다. 그래야 어두운 모드에서 같은 그림이 밤 풍경이 된다.
 */
export function PaperBackdrop({ nowHour, level }: PaperBackdropProps) {
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

  return (
    <div className={styles.backdrop} data-level={level} aria-hidden="true">
      {/* 가장 뒤 — 아주 크고 옅은 빛기둥 둘. 서로 다른 속도로 떠 하늘이 굳지 않게 한다 */}
      <span className={styles.orb} data-orb="1" />
      <span className={styles.orb} data-orb="2" />

      {/*
        해. 원반과 빛살까지 그려 보았으나 걷어냈다 (2026-09-01) — 배경에서 형태를 갖추면
        그것이 눈을 끌어 글보다 먼저 읽힌다. 여기에 필요한 것은 「빛이 퍼지는 자리」 하나뿐이다.
      */}
      <span className={styles.sun} style={{ left: `${x}%`, top: `${y}%`, opacity: isDay ? undefined : 0.22 }} />

      {CLOUD_COUNT[level] > 0 && (
        <svg className={styles.clouds} viewBox="0 0 1200 200" preserveAspectRatio="xMidYMin slice">
          {Array.from({ length: CLOUD_COUNT[level] }, (_, index) => (
            <g key={index} className={styles.cloud} data-cloud={index + 1}>
              <path d={CLOUD} />
            </g>
          ))}
        </svg>
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
