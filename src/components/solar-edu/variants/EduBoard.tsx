import type { EduLevel } from '@/interface/edu';
import type { EduContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import { ElementaryClock } from './elementary/ElementaryClock';
import { ElementaryPoster } from './elementary/ElementaryPoster';
import { KinderClock } from './kinder/KinderClock';
import { KinderPoster } from './kinder/KinderPoster';
import { KinderRelief } from './kinder/KinderRelief';
import { MiddleCompare } from './middle/MiddleCompare';
import { MiddleFlow } from './middle/MiddleFlow';
import { HighConsole } from './high/HighConsole';
import { HighTimeline } from './high/HighTimeline';

/** 비교용 시안. 현행은 이름이 없다 — 그것이 시안 A 다. */
export type EduVariant = 'b' | 'd' | 'e';

/**
 * 눈높이를 가리지 않는 시안인지.
 *
 * 시안 E 는 유치원 그림만 입체로 다시 그린 것이라 유치원에서만 뜻이 있다. 초·중·고에서 그 주소를
 * 열면 달라진 것이 없는데 시안만 하나 늘어난 것처럼 보이므로, 아예 현행 판으로 돌려보낸다.
 */
export function eduVariantFits(variant: EduVariant, level: EduLevel): boolean {
  return variant !== 'e' || level === 'kinder';
}

/**
 * 시안 이름표.
 *
 * 눈높이마다 콘셉트가 다르므로 시안 문자 하나로는 회의 자리에서 무엇을 보고 있는지 알 수 없다 —
 * "초등 시안 C" 가 아니라 "초등 시안 C · 숫자 놀이터" 라고 불려야 표에 적을 수 있다.
 *
 * 눈높이를 가리는 시안은 그 눈높이의 이름만 적는다. 나머지 칸을 억지로 채우면 초·중·고에서
 * 현행 판을 보면서 시안 이름표만 달고 있는 화면이 된다.
 */
export const EDU_VARIANT_LABEL: Record<EduVariant, Partial<Record<EduLevel, string>>> = {
  b: {
    kinder: '시안 B · 해님이 어디 있나요',
    elementary: '시안 B · 우리 학교의 하루',
    middle: '시안 B · 흐름도 한 장',
    high: '시안 B · AI 콘솔',
  },
  d: {
    kinder: '시안 D · 한 장 그림',
    elementary: '시안 D · 한 장 그림',
    middle: '시안 D · 비교 실험',
    high: '시안 D · 발전 원리 해설',
  },
  // 유치원 전용. 시안 D 와 화면이 같고 그림의 명암만 다르다.
  e: {
    kinder: '시안 E · 한 장 그림 (입체)',
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
  if (content.level === 'kinder') {
    if (variant === 'b') return <KinderClock stats={stats} content={content} nowHour={nowHour} />;
    if (variant === 'e') return <KinderRelief stats={stats} content={content} nowHour={nowHour} />;

    return <KinderPoster stats={stats} content={content} nowHour={nowHour} />;
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
