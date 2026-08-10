import { cn } from '@/utils/cn';
import type { EduContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { TOPIC_ICONS } from './EduIcons';
import { JourneyOverviewArt } from './JourneyOverviewArt';
import styles from './SolarEdu.module.scss';
import type { CSSProperties } from 'react';

/** 출력이 낮을 때의 흐름 주기(ms) — 느릴수록 전기가 적게 흐른다는 뜻이다. */
const SLOWEST_MS = 1800;
const FASTEST_MS = 420;

interface JourneyPanelProps {
  stats: EduStats;
  content: EduContent['journey'];
}

/**
 * 햇빛이 전기가 되기까지 (SFR-005-01/02).
 *
 * 단계를 하나씩 넘겨 보여 주면 앞뒤가 끊겨 전체가 한 줄로 이어진다는 것이 드러나지 않는다.
 * 계통도 한 장으로 네 단계를 다 보이고, 그 아래에서 의미·원리·환경적 효과만 짚는다.
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

      <div className={styles.journey__topics}>
        {content.topics.map((topic) => (
          <div key={topic.id} className={styles.topic}>
            <p className={styles.topic__head}>
              <span className={styles.topic__icon}>{TOPIC_ICONS[topic.id]}</span>
              {topic.title}
            </p>
            <p className={styles.topic__body}>{topic.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
