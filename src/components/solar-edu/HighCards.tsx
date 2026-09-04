import type { EduStats } from '@/mocks/solarEdu';
import type { MiddleContent } from '@/mocks/eduContent';
import { HighBenefitCard } from './HighBenefitCard';
import { HighPrincipleCard } from './HighPrincipleCard';
import { HighProductionCard } from './HighProductionCard';
import styles from './HighCards.module.scss';

interface HighCardsProps {
  stats: EduStats;
  content: MiddleContent;
}

/**
 * 중등 판 본문 (SFR-005-01/02/03/04).
 *
 * 고등과 다루는 축은 같다 — 원리, 발전량, 이점. 다른 것은 다루는 방식이다.
 * 고등이 값을 재고 따지는 화면이라면 여기는 설명하는 화면이라, 가장 큰 자리를 원리에 내주고
 * 그 원리가 네 단계로 스스로 넘어가며 한 토막씩 이야기하게 했다.
 */
export function HighCards({ stats, content }: HighCardsProps) {
  return (
    <div className={styles.grid}>
      <HighPrincipleCard stats={stats} content={content.principle} />
      <HighProductionCard stats={stats} content={content.production} />
      <HighBenefitCard stats={stats} content={content.benefit} />
    </div>
  );
}
