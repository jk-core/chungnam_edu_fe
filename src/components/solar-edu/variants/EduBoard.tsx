import type { EduLevel } from '@/interface/edu';
import type { EduContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { ElementaryClock } from './elementary/ElementaryClock';
import { ElementaryPoster } from './elementary/ElementaryPoster';
import { MiddleCompare } from './middle/MiddleCompare';
import { MiddleFlow } from './middle/MiddleFlow';
import { HighConsole } from './high/HighConsole';
import { HighTimeline } from './high/HighTimeline';

/** 비교용 시안. 현행은 이름이 없다 — 그것이 시안 A 다. */
export type EduVariant = 'b' | 'd';

/**
 * 시안 이름표.
 *
 * 눈높이마다 콘셉트가 다르므로 시안 문자 하나로는 회의 자리에서 무엇을 보고 있는지 알 수 없다 —
 * "초등 시안 C" 가 아니라 "초등 시안 C · 숫자 놀이터" 라고 불려야 표에 적을 수 있다.
 */
export const EDU_VARIANT_LABEL: Record<EduVariant, Record<EduLevel, string>> = {
  b: {
    elementary: '시안 B · 우리 학교의 하루',
    middle: '시안 B · 흐름도 한 장',
    high: '시안 B · AI 콘솔',
  },
  d: {
    elementary: '시안 D · 한 장 그림',
    middle: '시안 D · 비교 실험',
    high: '시안 D · 발전 원리 해설',
  },
};

interface EduBoardProps {
  variant: EduVariant;
  scopeLabel: string;
  stats: EduStats;
  content: EduContent;
  nowHour: number;
}

/**
 * 시안별 본문을 고르는 갈림길 (SFR-005).
 *
 * 눈높이 × 시안이라 아홉 갈래가 되는데, 이 갈림을 페이지에 두면 페이지가 아홉 개 판을 모두
 * 알아야 한다. 여기 한 곳에 모아 두면 페이지는 "시안이 있다" 만 알면 되고,
 * 고르고 난 뒤에는 이 파일과 variants 폴더만 지우면 원래대로 돌아온다.
 */
export function EduBoard({ variant, scopeLabel, stats, content, nowHour }: EduBoardProps) {
  if (content.level === 'elementary') {
    if (variant === 'b') return <ElementaryClock stats={stats} content={content} nowHour={nowHour} />;

    return <ElementaryPoster stats={stats} content={content} nowHour={nowHour} />;
  }

  if (content.level === 'middle') {
    if (variant === 'b') return <MiddleFlow stats={stats} content={content} />;

    return <MiddleCompare scopeLabel={scopeLabel} stats={stats} content={content} />;
  }

  if (variant === 'b') return <HighConsole scopeLabel={scopeLabel} stats={stats} content={content} />;

  return <HighTimeline scopeLabel={scopeLabel} stats={stats} content={content} />;
}
