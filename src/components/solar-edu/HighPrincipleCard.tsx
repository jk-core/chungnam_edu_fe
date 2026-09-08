import { useAutoPager } from '@/hooks/useAutoPager';
import type { EduStats } from '@/mocks/solarEdu';
import type { MiddlePrincipleContent } from '@/mocks/eduMiddle';
import { JourneyOverviewArt } from './JourneyOverviewArt';
import styles from './HighCards.module.scss';

/** 한 단계를 짚고 머무는 시간 */
const STEP_MS = 11_000;

interface HighPrincipleCardProps {
  stats: EduStats;
  content: MiddlePrincipleContent;
}

/**
 * 햇빛이 전기가 되기까지 (SFR-005-02/07).
 *
 * 네 단계를 한꺼번에 늘어놓으면 글 네 덩이가 되어 아무도 읽지 않는다. 그림에서 한 단계만 또렷하게 두고
 * 그 단계 이야기만 아래에 펼쳐, 화면이 스스로 한 토막씩 설명하게 했다. 나머지 단계는 지우지 않고 흐리게만
 * 두어, 지금 보는 곳이 전체 어디쯤인지도 함께 보인다.
 */
export function HighPrincipleCard({ stats, content }: HighPrincipleCardProps) {
  const pager = useAutoPager({ total: content.stages.length, perPage: 1, intervalMs: STEP_MS });
  const stage = content.stages[pager.page];

  return (
    <section className={styles.card}>
      <p className={styles.card__head}>
        {content.head}
        <span className={styles.card__note}>{content.note}</span>
      </p>

      <div className={styles.principle}>
        <div className={styles.principle__art}>
          <JourneyOverviewArt stats={stats} focus={stage.step} />
        </div>

        {/* 글이 갈릴 때 요소가 새로 만들어지도록 `key` 를 단계로 둔다 — 등장 효과가 다시 돈다 */}
        <div key={stage.id} className={styles.principle__text} role="status">
          <p className={styles.principle__term}>
            <span className={styles.principle__no}>{stage.step}</span>
            {stage.term}
          </p>
          <p className={styles.principle__body}>{stage.body}</p>
        </div>
      </div>

      <ol className={styles.steps}>
        {content.stages.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              className={index === pager.page ? styles['step--active'] : styles.step}
              onClick={() => pager.goTo(index)}
              aria-label={`${index + 1}단계 ${item.term}`}
              aria-current={index === pager.page ? 'true' : undefined}
            >
              {item.term}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
