import { CountUp } from '@/components/common/CountUp';
import { IMPACT_ITEMS } from '@/mocks/solarEdu';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { growthStage, kwhToTrees } from '@/utils/eco';
import type { EduStats } from '@/mocks/solarEdu';
import { GrowingTree } from './GrowingTree';
import { IMPACT_ICONS } from './EduIcons';
import styles from './SolarEdu.module.scss';

/** 나무가 다 자라는 기준 — 하루 등가 발전시간 5시간을 만점으로 본다. */
const FULL_GROWTH_HOURS = 5;

interface ImpactPanelProps {
  scopeLabel: string;
  stats: EduStats;
}

/**
 * 오늘 만든 전기가 무슨 뜻인지 (SFR-005-03/05/06).
 * 나무는 발전량에 따라 자란다 — 수치가 바뀌면 그림도 함께 바뀌는 자리다.
 */
export function ImpactPanel({ scopeLabel, stats }: ImpactPanelProps) {
  const trees = kwhToTrees(stats.dayKwh);
  const stage = growthStage(stats.equivalentHours / FULL_GROWTH_HOURS);

  return (
    <section className={cn(styles.panel, styles['panel--tall'])}>
      <p className={styles.panel__head}>
        숫자로 보는 의미
        {/* 대상 이름의 받침에 따라 조사가 달라지지 않도록 "에서" 로 받는다 */}
        <span className={styles.panel__note}>
          {scopeLabel}에서 오늘 만든 {formatNumber(stats.dayKwh)}kWh를 다른 것으로 바꿔 보면 이래요
        </span>
      </p>

      <div className={styles.impact}>
        <div className={styles.impact__tree}>
          <GrowingTree stage={stage} trees={trees} />
          <p className={styles.impact__caption}>
            해를 많이 모은 날일수록 나무가 더 자라요
          </p>
        </div>

        <div className={styles.impact__grid}>
          {IMPACT_ITEMS.map((item) => (
            <div key={item.id} className={styles.impactCard}>
              <span className={styles.impactCard__icon}>{IMPACT_ICONS[item.id]}</span>
              <p className={styles.impactCard__label}>{item.label}</p>
              <p className={styles.impactCard__value}>
                <CountUp
                  value={stats.dayKwh * item.perKwh}
                  fractionDigits={item.fractionDigits}
                  startOnView={false}
                />
                <span className={styles.impactCard__unit}>{item.unit}</span>
              </p>
              <p className={styles.impactCard__basis}>{item.basis}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
