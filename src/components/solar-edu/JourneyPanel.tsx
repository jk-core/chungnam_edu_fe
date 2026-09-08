import { cn } from '@/utils/cn';
import type { JourneyContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { JourneyOverviewArt } from './JourneyOverviewArt';
import styles from './SolarEdu.module.scss';
import type { CSSProperties } from 'react';

/** 출력이 낮을 때의 흐름 주기(ms) — 느릴수록 전기가 적게 흐른다는 뜻이다. */
const SLOWEST_MS = 1800;
const FASTEST_MS = 420;

interface JourneyPanelProps {
  stats: EduStats;
  content: JourneyContent;
}

/**
 * 햇빛이 전기가 되기까지 (SFR-005-01/02).
 *
 * 단계를 하나씩 넘겨 보여 주면 앞뒤가 끊겨 전체가 한 줄로 이어진다는 것이 드러나지 않는다.
 * 계통도 한 장으로 네 단계를 다 보인다.
 *
 * 그림 아래에 원리와 효과를 한 덩이씩 갈아 끼우던 칸이 있었는데 걷어냈다 (2026-09-04 지시).
 * 이 판은 글이 많다는 지적을 받고 있었고, 걷어낸 자리를 그림이 물려받아 계통도가 두 배 가까이
 * 커진다 — 같은 이야기를 가운데 열의 단계별 설명이 이미 하고 있어 덜어 낸 것은 중복이다.
 */
export function JourneyPanel({ stats, content }: JourneyPanelProps) {
  const ratio = Math.min(1, Math.max(0, stats.loadRatio));
  const flowMs = Math.round(SLOWEST_MS - (SLOWEST_MS - FASTEST_MS) * ratio);

  return (
    <section className={styles.journey} aria-label="햇빛이 전기가 되기까지">
      <p className={styles.journey__head}>
        {content.head}
        <span className={styles.journey__note}>{content.note}</span>
      </p>

      <div className={styles.journey__art}>
        <JourneyOverviewArt stats={stats} />
      </div>

      {/* 지금 흐르는 전기 — 출력이 높을수록 빠르게 흐른다 (SFR-005-07) */}
      <span
        className={cn(styles.journey__flow, { [styles['journey__flow--idle']]: !stats.isLive || ratio <= 0 })}
        style={{ '--flow-ms': `${flowMs}ms` } as CSSProperties}
        aria-hidden="true"
      />
    </section>
  );
}
