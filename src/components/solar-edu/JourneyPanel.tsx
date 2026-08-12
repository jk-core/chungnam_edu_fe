import { cn } from '@/utils/cn';
import { useAutoPager } from '@/hooks/useAutoPager';
import type { JourneyContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { TOPIC_ICONS } from './EduIcons';
import { JourneyOverviewArt } from './JourneyOverviewArt';
import styles from './SolarEdu.module.scss';
import type { CSSProperties } from 'react';

/** 출력이 낮을 때의 흐름 주기(ms) — 느릴수록 전기가 적게 흐른다는 뜻이다. */
const SLOWEST_MS = 1800;
const FASTEST_MS = 420;

/** 이야기 한 덩이가 머무는 시간 */
const TOPIC_MS = 11_000;

interface JourneyPanelProps {
  stats: EduStats;
  content: JourneyContent;
}

/**
 * 햇빛이 전기가 되기까지 (SFR-005-01/02).
 *
 * 단계를 하나씩 넘겨 보여 주면 앞뒤가 끊겨 전체가 한 줄로 이어진다는 것이 드러나지 않는다.
 * 계통도 한 장으로 네 단계를 다 보이고, 그 아래에서 원리와 효과를 짚는다.
 *
 * 이야기는 한 덩이씩 갈아 끼운다. 가운데 열을 AI 판단에 내주며 이 칸이 좁아져, 둘을 한꺼번에 늘어놓으면
 * 글이 잘렸다 — 잘린 글은 쓰지 않은 글과 같다. 스스로 넘어가면 좁은 자리에서도 둘 다 읽힌다.
 */
export function JourneyPanel({ stats, content }: JourneyPanelProps) {
  const ratio = Math.min(1, Math.max(0, stats.loadRatio));
  const flowMs = Math.round(SLOWEST_MS - (SLOWEST_MS - FASTEST_MS) * ratio);
  const pager = useAutoPager({ total: content.topics.length, perPage: 1, intervalMs: TOPIC_MS });
  const topic = content.topics[pager.page];

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

      <div className={styles.journey__story}>
        {/* `key` 를 이야기로 두어 글이 갈릴 때 요소가 새로 만들어지고 등장 효과가 다시 돈다 */}
        <div key={topic.id} className={styles.topic} role="status">
          <p className={styles.topic__head}>
            <span className={styles.topic__icon}>{TOPIC_ICONS[topic.id]}</span>
            {topic.title}
          </p>
          <p className={styles.topic__body}>{topic.body}</p>
        </div>

        <ol className={styles.journey__dots}>
          {content.topics.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className={index === pager.page ? styles['journey__dot--active'] : styles.journey__dot}
                onClick={() => pager.goTo(index)}
                aria-label={item.title}
                aria-current={index === pager.page ? 'true' : undefined}
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
