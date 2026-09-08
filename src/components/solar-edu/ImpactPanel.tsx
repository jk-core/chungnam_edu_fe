import { CountUp } from '@/components/common/CountUp';
import { cn } from '@/utils/cn';
import { impactFigure, impactOf } from '@/mocks/eduContent';
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
  const trees = kwhToTrees(stats.totalKwh);
  /* 한 가지만 세울 때는 카드가 자리를 통째로 받는다 — 석 장 배치 그대로면 위아래가 빈다 */
  const single = content.itemIds.length === 1;
  const stage = growthStage(stats.equivalentHours / FULL_GROWTH_HOURS);

  return (
    <section className={styles.panel}>
      <p className={styles.panel__head}>
        {content.head}
        <span className={styles.panel__note}>{content.note(scopeLabel, stats)}</span>
      </p>

      <div className={cn(styles.impact, { [styles['impact--single']]: single })}>
        {/* 왼쪽은 나무만. 곁의 설명을 떼어 오른쪽으로 보내면 그만큼 나무가 커진다 */}
        <div className={styles.impact__tree}>
          <GrowingTree stage={stage} trees={trees} />
        </div>

        {/*
          오른쪽에 설명과 수치를 한 덩이로 (2026-09-07 지시).

          설명이 나무 밑에 붙어 있을 때는 그림과 글이 위아래로 갈려, 왼쪽은 좁고 오른쪽은 비었다.
          글을 수치 쪽으로 모으면 「무엇을 어떻게 셌나 → 그래서 얼마」 가 한 줄기로 읽히고,
          왼쪽은 나무 한 그루가 통째로 쓴다.
        */}
        <div className={styles.impact__grid}>
          <p className={styles.impact__caption}>{content.caption}</p>

          {content.itemIds.map((id) => {
            const item = impactOf(id, content.copy?.[id]);
            const figure = impactFigure(item, stats.totalKwh);

            return (
              <div key={id} className={cn(styles.impactCard, { [styles['impactCard--single']]: single })}>
                <span className={styles.impactCard__icon}>{IMPACT_ICONS[id]}</span>
                <p className={styles.impactCard__label}>{item.label}</p>
                <p className={styles.impactCard__value}>
                  <CountUp
                    value={figure.amount}
                    fractionDigits={figure.fractionDigits}
                    startOnView={false}
                  />
                  {figure.countSuffix}
                  <span className={styles.impactCard__unit}>{figure.unit}</span>
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
