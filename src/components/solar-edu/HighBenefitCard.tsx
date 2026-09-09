import { CountUp } from '@/components/common/CountUp';
import { impactFigure, impactOf } from '@/mocks/eduContent';
import type { ImpactId } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import type { MiddleBenefitContent } from '@/mocks/eduMiddle';
import { ImpactArt } from './scene-art/ImpactArt';
import styles from './HighCards.module.scss';
import type { ImpactArtId } from './scene-art/ImpactArt';

/**
 * 환산값마다 세울 그림.
 *
 * 초등 판이 "무엇이 좋아졌나" 에서 쓰던 것을 그대로 가져온다. 복도에서 초등 판을 보던 아이가
 * 교실에서 중등 판을 볼 때 같은 그림이 서 있어야 같은 이야기로 이어진다.
 */
const ART_OF: Record<ImpactId, ImpactArtId> = {
  co2: 'co2',
  tree: 'tree',
  household: 'house',
  led: 'lamp',
};

interface HighBenefitCardProps {
  stats: EduStats;
  content: MiddleBenefitContent;
}

/**
 * 그래서 무엇이 좋아지는가 (SFR-005-03/05).
 *
 * 전에는 자라는 나무 한 그루가 칸의 절반을 차지하고 환산값 넷이 그 아래 줄지어 있었다. 나무는
 * 예쁘지만 **나무 하나만 설명한다** — 나머지 셋은 값만 남고, 정작 이 칸의 물음인 "무엇이
 * 좋아지는가" 에는 답하지 못했다.
 *
 * 그래서 넷을 같은 크기로 세우고 저마다 그림·값·한 줄 설명을 갖게 했다. 그림은 초등 판이
 * 쓰던 것을 그대로 가져와, 두 판을 오가며 보는 아이가 같은 것을 말하고 있다는 걸 알아본다.
 * 값 아래 한 줄이 붙어야 표가 아니라 설명이 된다.
 */
export function HighBenefitCard({ stats, content }: HighBenefitCardProps) {
  return (
    <section className={styles.card}>
      <p className={styles.card__head}>
        {content.head}
        <span className={styles.card__note}>{content.note}</span>
      </p>

      <ul className={styles.benefit}>
        {content.itemIds.map((id) => {
          const item = impactOf(id, content.copy?.[id]);
          const figure = impactFigure(item, stats.totalKwh);

          return (
            <li key={id} className={styles.impact}>
              <span className={styles.impact__art} aria-hidden="true">
                <ImpactArt id={ART_OF[id]} />
              </span>

              <div className={styles.impact__text}>
                <p className={styles.impact__label}>{item.label}</p>
                <p className={styles.impact__value}>
                  <CountUp
                    value={figure.amount}
                    fractionDigits={figure.fractionDigits}
                    startOnView={false}
                  />
                  {/*
                    「만」·「억」 은 숫자에 붙어야 하지만 숫자와 같은 크기로 설 것은 아니다.
                    글자 없이 두면 큰 숫자의 크기를 그대로 받아 「773만」 의 「만」 이 세 자리
                    숫자만큼 자리를 먹었다 (2026-09-09 지시).
                  */}
                  {figure.countSuffix && (
                    <span className={styles.impact__suffix}>{figure.countSuffix}</span>
                  )}
                  <span className={styles.impact__unit}>{figure.unit}</span>
                </p>
                <p className={styles.impact__line}>{item.line}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
