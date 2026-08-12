import { CountUp } from '@/components/common/CountUp';
import { impactOf } from '@/mocks/eduContent';
import { growthStage, kwhToTrees } from '@/utils/eco';
import type { ImpactContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { GrowingTree } from './GrowingTree';
import { IMPACT_ICONS } from './EduIcons';
import styles from './SolarEdu.module.scss';

/** 나무가 다 자라는 기준 — 하루 등가 발전시간 5시간을 만점으로 본다. */
const FULL_GROWTH_HOURS = 5;

interface ImpactPanelProps {
  scopeLabel: string;
  stats: EduStats;
  content: ImpactContent;
}

/**
 * 오늘 만든 전기가 무슨 뜻인지 (SFR-005-03/05/06).
 * 나무는 발전량에 따라 자란다 — 수치가 바뀌면 그림도 함께 바뀌는 자리다.
 */
export function ImpactPanel({ scopeLabel, stats, content }: ImpactPanelProps) {
  const trees = kwhToTrees(stats.dayKwh);
  const stage = growthStage(stats.equivalentHours / FULL_GROWTH_HOURS);

  return (
    <section className={styles.panel}>
      <p className={styles.panel__head}>
        {content.head}
        <span className={styles.panel__note}>{content.note(scopeLabel, stats)}</span>
      </p>

      <div className={styles.impact}>
        <div className={styles.impact__tree}>
          <GrowingTree stage={stage} trees={trees} />
          <p className={styles.impact__caption}>{content.caption}</p>
        </div>

        <div className={styles.impact__grid}>
          {content.itemIds.map((id) => {
            const item = impactOf(id, content.copy?.[id]);

            return (
              <div key={id} className={styles.impactCard}>
                <span className={styles.impactCard__icon}>{IMPACT_ICONS[id]}</span>
                <p className={styles.impactCard__label}>{item.label}</p>
                <p className={styles.impactCard__value}>
                  <CountUp
                    value={stats.dayKwh * item.perKwh}
                    fractionDigits={item.fractionDigits}
                    startOnView={false}
                  />
                  <span className={styles.impactCard__unit}>{item.unit}</span>
                </p>
                {content.showBasis ? <p className={styles.impactCard__basis}>{item.basis}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
