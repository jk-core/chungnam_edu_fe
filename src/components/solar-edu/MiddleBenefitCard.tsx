import { CountUp } from '@/components/common/CountUp';
import { growthStage, kwhToTrees } from '@/utils/eco';
import { impactOf } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import type { MiddleBenefitContent } from '@/mocks/eduMiddle';
import { GrowingTree } from './GrowingTree';
import { IMPACT_ICONS } from './EduIcons';
import styles from './MiddleBoard.module.scss';

/** 나무가 다 자라는 기준 — 하루 등가 발전시간 5시간을 만점으로 본다. */
const FULL_GROWTH_HOURS = 5;

interface MiddleBenefitCardProps {
  scopeLabel: string;
  stats: EduStats;
  content: MiddleBenefitContent;
}

/**
 * 그래서 무엇이 좋아지는가 (SFR-005-03/05).
 * 나무는 발전량을 따라 자란다 — 값이 바뀌면 그림도 바뀌는 자리다.
 */
export function MiddleBenefitCard({ scopeLabel, stats, content }: MiddleBenefitCardProps) {
  const trees = kwhToTrees(stats.dayKwh);
  const stage = growthStage(stats.equivalentHours / FULL_GROWTH_HOURS);

  return (
    <section className={styles.card}>
      <p className={styles.card__head}>
        {content.head}
        <span className={styles.card__note}>{content.note(scopeLabel, stats)}</span>
      </p>

      <div className={styles.benefit}>
        <div className={styles.benefit__tree}>
          <GrowingTree stage={stage} trees={trees} />
          <p className={styles.benefit__caption}>{content.caption}</p>
        </div>

        <ul className={styles.benefit__list}>
          {content.itemIds.map((id) => {
            const item = impactOf(id, content.copy?.[id]);

            return (
              <li key={id} className={styles.chip}>
                <span className={styles.chip__icon}>{IMPACT_ICONS[id]}</span>
                <span className={styles.chip__label}>{item.label}</span>
                <span className={styles.chip__value}>
                  <CountUp
                    value={stats.dayKwh * item.perKwh}
                    fractionDigits={item.fractionDigits}
                    startOnView={false}
                  />
                  <span className={styles.chip__unit}>{item.unit}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
