import type { EduStats } from '@/mocks/solarEdu';
import styles from './PaperDayArt.module.scss';

/** 그리는 판의 크기. `preserveAspectRatio` 를 풀어 두므로 칸에 맞춰 늘어난다. */
const W = 240;
const H = 72;

/** 위쪽에 남기는 여백 — 꼭대기가 선에 닿으면 잘린 것처럼 보인다 */
const TOP = 8;

interface PaperDayArtProps {
  stats: EduStats;
}

/** 시간대별 값을 판 위의 점으로 옮긴다 */
function toPoints(hourly: number[]): Array<[number, number]> {
  const peak = Math.max(...hourly, 1);

  return hourly.map((value, index) => [
    (index / (hourly.length - 1)) * W,
    H - (value / peak) * (H - TOP),
  ]);
}

/**
 * 점들을 부드럽게 잇는다.
 *
 * 곧은 선으로 이으면 시간마다 꺾여 톱니가 된다. 해가 뜨고 지는 동안의 발전은 이어진 하나의
 * 산이므로, 두 점 사이의 가운데를 지나는 곡선으로 이어야 눈에 익은 모양이 된다.
 */
function toPath(points: Array<[number, number]>): string {
  const [first, ...rest] = points;
  let path = `M${first[0]} ${first[1]}`;

  rest.forEach(([x, y], index) => {
    const [px, py] = points[index];

    path += ` Q${px} ${py} ${(px + x) / 2} ${(py + y) / 2}`;
  });

  const last = points[points.length - 1];

  return `${path} L${last[0]} ${last[1]}`;
}

/**
 * 1장에 얹는 하루 곡선 (SFR-005-02).
 *
 * 실시간 출력은 지금 한 점의 값이라, 그 값만으로는 오늘이 어떤 하루였는지 알 수 없다.
 * 하루 전체를 산 모양으로 한 번 그려 두면 지금이 오르는 길인지 내리는 길인지가 함께 읽힌다.
 *
 * 차트 라이브러리를 쓰지 않고 직접 그린다. 눈금도 이름표도 없는 **그림**이라 축과 도구가
 * 필요 없고, 선이 그려지는 움직임도 여기서는 CSS 한 줄로 끝난다.
 */
export function PaperDayArt({ stats }: PaperDayArtProps) {
  const points = toPoints(stats.hourly);
  const path = toPath(points);
  const now = points[Math.max(0, Math.min(points.length - 1, Math.round(stats.nowHour)))];

  return (
    <svg className={styles.art} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="presentation">
      <defs>
        <linearGradient id="paper-day-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--solar)" stopOpacity="0.34" />
          <stop offset="100%" stopColor="var(--solar)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path className={styles.art__fill} d={`${path} L${W} ${H} L0 ${H} Z`} fill="url(#paper-day-fill)" />
      <path className={styles.art__line} d={path} />

      {/*
        지금 이 순간의 자리.
        판이 가로로 늘어나므로 원을 그리면 타원이 된다 — 세로로만 선 하나를 세워 짚는다.
      */}
      <line className={styles.art__now} x1={now[0]} y1={now[1]} x2={now[0]} y2={H} />
    </svg>
  );
}
