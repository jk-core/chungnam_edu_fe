import type { EduLevel } from '@/interface/edu';
import { ELEMENTARY_CONTENT } from '@/mocks/eduElementary';
import { ELEMENTARY_PICTURE } from '@/mocks/eduPicture';
import { HIGH_CONTENT } from '@/mocks/eduContent';
import { MIDDLE_CONTENT } from '@/mocks/eduMiddle';
import type { DayWeather } from '@/interface/weather';
import type { EduStats } from '@/mocks/solarEdu';
import { ElementaryStage } from '../ElementaryStage';
import { HighBoard } from '../HighBoard';
import { HighCards } from '../HighCards';
import { ElementaryClock } from './elementary/ElementaryClock';
import { ElementaryRelief } from './elementary/ElementaryRelief';
import { MiddleCardDeck } from './middle/MiddleCardDeck';
import { MiddleClock } from './middle/MiddleClock';
import { HighPoster } from './high/HighPoster';

/** 견줘 볼 시안 셋. 눈높이마다 같은 세 자리를 둔다. */
export type EduVariant = 'a' | 'b' | 'c';

export const EDU_VARIANTS: EduVariant[] = ['a', 'b', 'c'];

/**
 * 한 칸의 성격.
 *
 * 눈높이 × 시안이라 열두 칸인데, 칸마다 본문만 다른 것이 아니라 **껍데기까지 다르다** —
 * 어떤 칸은 위쪽 수치 띠를 달고 어떤 칸은 그 자리를 그림에 내준다. 이것을 화면 쪽에 갈림문으로
 * 두면 조건이 화면 곳곳에 흩어지므로, 칸의 성격을 여기 표 하나에 모아 두고 화면은 표를 읽기만 한다.
 */
export interface EduCell {
  /** 회의 자리에서 부르는 이름 */
  label: string;
  /**
   * 껍데기가 읽을 대본의 눈높이.
   *
   * 보는 사람의 눈높이와 어긋나는 칸이 여럿이다 — 고등 a 는 초등 대본을, 고등 c 는 중등 대본을
   * 읽는다. 회의에서 그 조합이 낫다고 본 것이라 그대로 굳혔다. 머리줄 띠와 아래 티커도
   * 본문과 같은 대본을 봐야 하므로 여기 한 곳이 그것을 정한다.
   */
  script: EduLevel;
  /** 위쪽 수치 띠를 다는지 */
  headline: boolean;
  /** 아래를 도는 「알고 계셨나요」 줄을 다는지 */
  facts: boolean;
  /**
   * 화면 제목 아래 한 줄(조회 대상의 설비 정보)을 다는지.
   *
   * 고등 a 만 뗀다 (2026-09-04 노트). 그 판은 벽보라 제목이 커야 하는데, 바로 아래에 작은 줄이
   * 붙으면 둘이 한 덩이로 보여 제목이 눌린다. 같은 값은 머리줄 띠의 설비용량 칸에 이미 있다.
   */
  subtitle?: boolean;
  /**
   * 공용 레이아웃을 쓰지 않고 골격까지 제 것을 세우는 칸인지.
   *
   * 중등 a 하나뿐이다. 그 판은 스스로 머리줄과 고르개를 안고 그리므로 공용 껍데기에 끼우면
   * 같은 값을 두 번 말한다. 화면이 이 표시를 보고 아예 다른 조립으로 간다.
   */
  standalone?: boolean;
}

/**
 * 시안 격자 (SFR-005).
 *
 * 고르고 난 뒤에는 이 파일과 variants 폴더만 지우면 한 벌만 남는다.
 */
export const EDU_CELLS: Record<EduLevel, Record<EduVariant, EduCell>> = {
  elementary: {
    a: { label: '시안 a · 걸음마다 한 장', script: 'elementary', headline: true, facts: false },
    // 글 대신 그림이 본문인 두 판. 위쪽 띠를 떼어 낸 자리를 그림이 물려받는다.
    b: { label: '시안 b · 하루 한 바퀴', script: 'elementary', headline: false, facts: false },
    c: { label: '시안 c · 한 장에 다, 입체', script: 'elementary', headline: false, facts: false },
  },
  middle: {
    a: { label: '시안 a · 세 개의 질문', script: 'middle', headline: true, facts: false, standalone: true },
    b: { label: '시안 b · 한 장에 다, 책', script: 'elementary', headline: true, facts: false },
    c: { label: '시안 c · 한 장씩 넘겨 읽기', script: 'elementary', headline: true, facts: false },
  },
  high: {
    a: { label: '시안 a · 한 장 그림', script: 'elementary', headline: true, facts: false, subtitle: false },
    b: { label: '시안 b · 데이터 콘솔', script: 'high', headline: true, facts: true },
    c: { label: '시안 c · 설명 카드 셋', script: 'middle', headline: true, facts: true },
  },
};

interface EduBoardProps {
  /** 보는 사람의 눈높이 — 어느 판을 세울지는 이것과 시안이 함께 정한다 */
  level: EduLevel;
  variant: EduVariant;
  scopeLabel: string;
  stats: EduStats;
  nowHour: number;
  today: DayWeather;
  forecast: DayWeather[];
}

/**
 * 시안별 본문을 고르는 갈림길 (SFR-005).
 *
 * 판마다 읽는 대본이 정해져 있어 여기서 곧장 집어 넘긴다. 보는 사람의 눈높이를 그대로 따르지 않고
 * `EDU_CELLS` 가 정한 대본을 쓰는 칸이 여럿이라, 대본을 밖에서 받아 오면 어느 칸이 무엇을 읽는지가
 * 두 곳으로 갈라진다.
 */
export function EduBoard({ level, variant, scopeLabel, stats, nowHour, today, forecast }: EduBoardProps) {
  if (level === 'elementary') {
    if (variant === 'b') return <ElementaryClock stats={stats} content={ELEMENTARY_PICTURE} nowHour={nowHour} />;
    if (variant === 'c') return <ElementaryRelief stats={stats} content={ELEMENTARY_PICTURE} nowHour={nowHour} />;

    return <ElementaryStage stats={stats} content={ELEMENTARY_CONTENT} />;
  }

  if (level === 'middle') {
    if (variant === 'c') return <MiddleCardDeck stats={stats} nowHour={nowHour} />;

    // 시안 a 는 골격까지 제 것이라 화면 쪽에서 이미 갈라졌다 — 여기 닿는 것은 b 뿐이다.
    return <MiddleClock stats={stats} nowHour={nowHour} weather={today} forecast={forecast} />;
  }

  if (variant === 'a') return <HighPoster stats={stats} nowHour={nowHour} today={today} forecast={forecast} />;
  if (variant === 'c') return <HighCards stats={stats} content={MIDDLE_CONTENT} />;

  return <HighBoard scopeLabel={scopeLabel} stats={stats} content={HIGH_CONTENT} />;
}
