import { CountUp } from '@/components/common/CountUp';
import { formatNumber } from '@/utils/format';
import { growthStage, kwhToTrees } from '@/utils/eco';
import { impactOf } from '@/mocks/eduContent';
import type { EduContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { cn } from '@/utils/cn';
import { GrowingTree } from './GrowingTree';
import { IMPACT_ICONS } from './EduIcons';
import { JourneyOverviewArt } from './JourneyOverviewArt';
import styles from './SolarEdu.module.scss';

/** 나무가 다 자라는 기준 — 하루 등가 발전시간 5시간을 만점으로 본다. */
const FULL_GROWTH_HOURS = 5;

/** 해 그림이 가장 작아지는 크기(0~1). 0 이면 아예 사라져 칸이 비어 보인다. */
const MIN_SUN = 0.34;

/**
 * 하루를 나누는 네 토막.
 * 시각을 하나씩 짚는 대신 "언제 많이 만들었나" 만 남긴다.
 */
const SLOTS = [
  { id: 'morning', label: '아침', emoji: '🌅', from: 6, to: 10 },
  { id: 'noon', label: '낮', emoji: '☀️', from: 10, to: 14 },
  { id: 'afternoon', label: '오후', emoji: '🌤️', from: 14, to: 17 },
  { id: 'evening', label: '저녁', emoji: '🌇', from: 17, to: 20 },
];

interface ElementaryBoardProps {
  scopeLabel: string;
  stats: EduStats;
  content: EduContent;
}

/**
 * 초등 판 본문 (SFR-005-01/04/06).
 *
 * 고등 판의 네 패널 구성을 그대로 줄이지 않고, 그림 세 덩이로 다시 짰다 —
 * 해가 지나간 하루, 전기가 오는 길, 그걸로 할 수 있는 일. 글은 덜고 그림을 키워
 * 복도에서 지나가며 보는 아이가 한 번에 하나씩만 읽게 한다.
 */
export function ElementaryBoard({ scopeLabel, stats, content }: ElementaryBoardProps) {
  const slots = SLOTS.map((slot) => ({
    ...slot,
    kwh: stats.hourly.slice(slot.from, slot.to).reduce((sum, value) => sum + value, 0),
  }));
  const peak = Math.max(...slots.map((slot) => slot.kwh), 0);
  const trees = kwhToTrees(stats.dayKwh);
  const stage = growthStage(stats.equivalentHours / FULL_GROWTH_HOURS);

  return (
    <div className={styles.kid}>
      {/* 하루 — 해 크기가 그 시간에 만든 양이다 */}
      <section className={cn(styles.kidCard, styles['kidCard--day'])}>
        <p className={styles.kidCard__head}>
          <span className={styles.kidCard__emoji} aria-hidden="true">🌞</span>
          {content.day.head}
          <span className={styles.kidCard__note}>{content.day.note(stats)}</span>
        </p>

        <ul className={styles.kidDay}>
          {slots.map((slot) => {
            const ratio = peak > 0 ? slot.kwh / peak : 0;
            const scale = MIN_SUN + (1 - MIN_SUN) * ratio;
            const isNow = stats.nowHour >= slot.from && stats.nowHour < slot.to;

            return (
              <li key={slot.id} className={cn(styles.kidSlot, { [styles['kidSlot--now']]: isNow })}>
                <span className={styles.kidSlot__sky}>
                  <span className={styles.kidSlot__sun} style={{ transform: `scale(${scale.toFixed(3)})` }} />
                </span>
                <p className={styles.kidSlot__label}>
                  <span aria-hidden="true">{slot.emoji}</span>
                  {slot.label}
                  {isNow ? <span className={styles.kidSlot__badge}>지금</span> : null}
                </p>
                <p className={styles.kidSlot__value}>
                  {formatNumber(slot.kwh)}
                  <span className={styles.kidSlot__unit}>kWh</span>
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 전기가 오는 길 — 그림 한 장으로 네 단계를 잇는다 */}
      <section className={cn(styles.kidCard, styles['kidCard--path'])}>
        <p className={styles.kidCard__head}>
          <span className={styles.kidCard__emoji} aria-hidden="true">⚡</span>
          {content.journey.head}
          <span className={styles.kidCard__note}>{content.journey.note}</span>
        </p>

        <div className={styles.kidPath}>
          <JourneyOverviewArt stats={stats} />
        </div>

        {/* 그림만으로는 "왜" 가 남지 않는다 — 네 단계를 한 줄씩 덧붙인다 (SFR-005-02) */}
        {content.journey.steps ? (
          <ol className={styles.kidSteps}>
            {content.journey.steps.map((step, index) => (
              <li key={step.id} className={styles.kidStep}>
                <span className={styles.kidStep__emoji} aria-hidden="true">{step.emoji}</span>
                <span className={styles.kidStep__body}>
                  <span className={styles.kidStep__term}>
                    <span className={styles.kidStep__no}>{index + 1}</span>
                    {step.term}
                  </span>
                  <span className={styles.kidStep__text}>{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      {/* 오늘 만든 걸로 할 수 있는 일 — 나무가 자라고, 카드가 뜻을 풀어 준다 */}
      <section className={cn(styles.kidCard, styles['kidCard--impact'])}>
        <p className={styles.kidCard__head}>
          <span className={styles.kidCard__emoji} aria-hidden="true">🌳</span>
          {content.impact.head}
          <span className={styles.kidCard__note}>{content.impact.note(scopeLabel, stats)}</span>
        </p>

        <div className={styles.kidImpact}>
          <div className={styles.kidImpact__tree}>
            <GrowingTree stage={stage} trees={trees} />
            <p className={styles.kidImpact__caption}>{content.impact.caption}</p>
          </div>

          <ul className={styles.kidImpact__grid}>
            {content.impact.itemIds.map((id) => {
              const item = impactOf(id, content.impact.copy?.[id]);

              return (
                <li key={id} className={styles.kidChip}>
                  <span className={styles.kidChip__icon}>{IMPACT_ICONS[id]}</span>
                  <span className={styles.kidChip__body}>
                    <span className={styles.kidChip__label}>{item.label}</span>
                    <span className={styles.kidChip__value}>
                      <CountUp
                        value={stats.dayKwh * item.perKwh}
                        fractionDigits={item.fractionDigits}
                        startOnView={false}
                      />
                      <span className={styles.kidChip__unit}>{item.unit}</span>
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
