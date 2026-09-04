import type { EduLevel } from '@/interface/edu';
import { PAPER_LABEL } from '@/mocks/eduPaper';
import type { EduContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { CardDeck } from './c/CardDeck';
import { SplitBoard } from './c/SplitBoard';
import { TwoColumnBoard } from './c/TwoColumnBoard';
import { ElementaryClock } from './elementary/ElementaryClock';
import { ElementaryPoster } from './elementary/ElementaryPoster';
import { MiddleCompare } from './middle/MiddleCompare';
import { MiddleFlow } from './middle/MiddleFlow';
import { HighConsole } from './high/HighConsole';
import { HighTimeline } from './high/HighTimeline';

/**
 * 비교용 시안. 현행은 이름이 없다 — 그것이 시안 A 다.
 *
 * 시안 E 는 이 갈림길을 지나지 않는다. 공용 레이아웃을 쓰지 않고 골격까지 제 것을 세우므로
 * 페이지에서 곧장 갈라진다 — 여기에는 학교 고르개가 주소를 지을 때 쓸 이름만 남는다.
 */
export type EduVariant = 'b' | 'c' | 'd' | 'e';

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
  /*
    시안 C 는 학교급마다 골격이 다르다.
    초등은 한 장씩 넘겨 읽고, 중등은 화면을 좌우로 갈라 왼쪽에 원리를 오른쪽에 오늘을 두며,
    고등은 가로로 갈라 위에 오늘의 값을 아래에 원리를 둔다.
  */
  c: {
    elementary: '시안 C · 한 장씩',
    middle: '시안 C · 왼쪽 원리 오른쪽 오늘',
    high: '시안 C · 위는 오늘 아래는 원리',
  },
  d: {
    elementary: '시안 D · 한 장 그림',
    middle: '시안 D · 비교 실험',
    high: '시안 D · 발전 원리 해설',
  },
  // 시안 E 는 눈높이가 갈려도 골격이 하나다 — 갈리는 것은 말의 높낮이뿐이다.
  e: {
    elementary: PAPER_LABEL,
    middle: PAPER_LABEL,
    high: PAPER_LABEL,
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
  /*
    시안 C 는 초등만 한 장씩 넘긴다.
    중·고등은 앞뒤를 견줘야 하는 나이라 여러 칸을 한 화면에 둔다 — 다만 시안 A 보다 칸이 적고 넓다.
  */
  if (variant === 'c') {
    if (content.level === 'elementary') return <CardDeck stats={stats} nowHour={nowHour} />;
    if (content.level === 'middle') return <TwoColumnBoard stats={stats} />;

    return <SplitBoard stats={stats} />;
  }

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
