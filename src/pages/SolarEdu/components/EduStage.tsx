import { ElementaryStage } from '@/components/solar-edu/ElementaryStage';
import { EduBoard } from '@/components/solar-edu/variants/EduBoard';
import { HighBoard } from '@/components/solar-edu/HighBoard';
import { MiddleBoard } from '@/components/solar-edu/MiddleBoard';
import type { EduContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import type { EduVariant } from '@/components/solar-edu/variants/EduBoard';

interface EduStageProps {
  variant?: EduVariant;
  scopeLabel: string;
  stats: EduStats;
  content: EduContent;
  nowHour: number;
}

/**
 * 본문 한 판 (SFR-005).
 *
 * 시안을 고르면 그쪽이 눈높이까지 안고 그린다. 고르지 않았으면 현행 판을 눈높이대로 세운다.
 */
export function EduStage({ variant, scopeLabel, stats, content, nowHour }: EduStageProps) {
  if (variant) {
    return <EduBoard variant={variant} scopeLabel={scopeLabel} stats={stats} content={content} nowHour={nowHour} />;
  }

  if (content.level === 'elementary') return <ElementaryStage stats={stats} content={content} />;

  if (content.level === 'middle') return <MiddleBoard scopeLabel={scopeLabel} stats={stats} content={content} />;

  return <HighBoard scopeLabel={scopeLabel} stats={stats} content={content} />;
}
