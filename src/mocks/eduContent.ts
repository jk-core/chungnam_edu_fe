import { CO2_PER_KWH, CO2_PER_TREE_YEAR, kwhToHouseholdDays } from '@/utils/eco';
import { formatNumber, formatPercent } from '@/utils/format';
import type { AnalysisStage } from '@/interface/diagnosis';
import type { EduLevel } from '@/interface/edu';
import type { School, SchoolLevel } from '@/interface/energy';
import { ELEMENTARY_CONTENT } from './eduElementary';
import { FULL_SUN_WM2 } from './solarEdu';
import { MIDDLE_CONTENT } from './eduMiddle';
import type { EduBenefit, EduScene, ElementaryImpact } from './eduElementary';
import type { MiddleBenefitContent, MiddlePrincipleContent, MiddleProductionContent } from './eduMiddle';
import type { EduStats } from './solarEdu';

/*
  교육용 대시보드의 수준별 콘텐츠 (SFR-005-02/03/04).

  세 판은 이제 본문 구조 자체가 갈린다 — 초등은 스스로 넘어가는 장면, 중등은 설명 카드 셋,
  고등은 AI 판단을 가운데 둔 분석 판이다. 그래서 `EduContent` 를 판별 유니온으로 두고,
  세 판이 진짜로 나눠 쓰는 것(위쪽 수치 띠와 아래쪽 티커)만 밑동에 남겼다.

  값을 만드는 함수(`value`, `note`)는 데이터로 뺄 수 없어 아래 레지스트리에 두고, 수준별 리터럴은
  "무엇을 몇 개 어떤 순서로 보일지" 와 "문구를 무엇으로 덮어쓸지" 만 담는다. 그래야 학교를 바꾸면
  수치만, 수준을 바꾸면 문구만 갈린다.

  초등·중등 리터럴은 분량이 커 각자 파일로 나갔다(`eduElementary.ts`, `eduMiddle.ts`).
  그 두 파일이 여기서 타입을 가져오고 여기가 그 값을 가져오므로 서로를 참조하지만,
  되돌아오는 쪽이 `import type` 뿐이라 컴파일 뒤에는 남지 않는다.
*/

export const EDU_LEVELS: EduLevel[] = ['elementary', 'middle', 'high'];

export const EDU_LEVEL_LABEL: Record<EduLevel, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
};

/** 학교급이 곧 눈높이다. 특수학교는 학령이 넓어 가장 쉽게 읽히는 초등 판을 기본으로 둔다. */
const BY_SCHOOL_LEVEL: Record<SchoolLevel, EduLevel> = {
  초등학교: 'elementary',
  중학교: 'middle',
  고등학교: 'high',
  특수학교: 'elementary',
};

/**
 * 어느 눈높이로 보여 줄지 정한다.
 * 화면에서 고른 값(`?level=`)이 가장 세고, 없으면 학교급을 따르고,
 * 학교가 정해지지 않은 도 전체 화면은 정보가 가장 많은 고등 판으로 둔다.
 */
export function resolveEduLevel(plant: School | null, param: string | null): EduLevel {
  if (param && (EDU_LEVELS as string[]).includes(param)) return param as EduLevel;
  if (plant) return BY_SCHOOL_LEVEL[plant.level] ?? 'high';

  return 'high';
}

// ── 지표 레지스트리 ────────────────────────────────────────

/** 표준 교실 한 칸의 넓이(m²) — 넓이를 몸으로 아는 단위로 바꿔 준다. */
const CLASSROOM_M2 = 66;

export type StatId = 'today' | 'irradiance' | 'insolation' | 'area';

export interface StatDef {
  label: string;
  value: (stats: EduStats) => number;
  unit: string;
  fractionDigits: number;
  /** 단위를 몰라도 크기를 가늠할 수 있게 하는 한 줄 */
  note: (stats: EduStats) => string;
}

/** 값을 만드는 셈은 수준과 무관하다 — 라벨과 덧붙임 문구만 수준이 덮어쓴다. */
export const STAT_DEFS: Record<StatId, StatDef> = {
  today: {
    label: '오늘 만든 전기',
    value: (stats) => stats.todayKwh,
    unit: 'kWh',
    fractionDigits: 0,
    note: (stats) => `네 식구 사는 집 ${formatNumber(kwhToHouseholdDays(stats.todayKwh))}곳이 하루 쓸 양이에요`,
  },
  irradiance: {
    label: '지금 햇빛 세기',
    value: (stats) => (stats.irradianceNow / FULL_SUN_WM2) * 100,
    unit: '점',
    fractionDigits: 0,
    note: (stats) => `맑은 날 정오가 100점이에요 (${formatNumber(stats.irradianceNow)} W/m²)`,
  },
  insolation: {
    label: '해를 모은 시간',
    value: (stats) => stats.equivalentHours,
    unit: '시간',
    fractionDigits: 1,
    note: () => '가장 셀 때로 치면 이만큼 돌린 셈이에요',
  },
  area: {
    label: '햇빛 받는 넓이',
    value: (stats) => stats.moduleArea,
    unit: 'm²',
    fractionDigits: 0,
    note: (stats) => `교실 ${formatNumber(stats.moduleArea / CLASSROOM_M2)}칸만 한 넓이예요`,
  },
};

/** 수준이 덮어쓸 수 있는 부분만 */
export interface StatCopy {
  label?: string;
  note?: (stats: EduStats) => string;
}

// ── 환산 레지스트리 ────────────────────────────────────────

export type ImpactId = 'co2' | 'tree' | 'household' | 'led';

export interface ImpactDef {
  label: string;
  /** 1kWh 당 환산값 */
  perKwh: number;
  unit: string;
  basis: string;
  fractionDigits: number;
}

export const IMPACT_DEFS: Record<ImpactId, ImpactDef> = {
  co2: {
    label: '줄인 온실가스',
    perKwh: CO2_PER_KWH,
    unit: 'kg CO₂',
    basis: `전기 1kWh 를 만들 때 나오는 ${CO2_PER_KWH}kg 으로 셈했어요`,
    fractionDigits: 0,
  },
  tree: {
    label: '나무를 심은 효과',
    // 줄인 CO₂ 를 소나무가 1년 동안 마시는 양으로 나눈다. 계수는 utils/eco 와 한 곳을 본다.
    perKwh: CO2_PER_KWH / CO2_PER_TREE_YEAR,
    unit: '그루',
    basis: `소나무 한 그루가 1년에 마시는 ${CO2_PER_TREE_YEAR}kg 으로 셈했어요`,
    fractionDigits: 0,
  },
  household: {
    label: '네 식구가 쓰는 날',
    perKwh: 1 / (350 / 30),
    unit: '일',
    basis: '한 집이 하루에 쓰는 11.7kWh 로 셈했어요',
    fractionDigits: 1,
  },
  led: {
    label: '교실 조명 켜는 시간',
    perKwh: 25,
    unit: '시간',
    basis: '40W 짜리 조명 하나를 켠다고 셈했어요',
    fractionDigits: 0,
  },
};

/** 수준이 덮어쓸 수 있는 부분만 */
export interface ImpactCopy {
  label?: string;
}

// ── 조각 타입 ──────────────────────────────────────────────
/*
  패널들이 `EduContent['day']` 처럼 인덱싱해 쓰던 것을 조각 타입으로 꺼내 둔다.
  유니온이 되고 나면 인덱싱이 세 판 공통 필드에만 닿기 때문이다.
*/

/** 그림 옆에 붙는 설명 한 덩이 */
export interface EduNote {
  id: string;
  term: string;
  body: string;
}

/** 계통도 아래 세 가지 이야기 (SFR-005-01/02) */
export interface EduTopic {
  id: 'meaning' | 'principle' | 'effect';
  title: string;
  body: string;
}

/** 위쪽에 고정으로 붙는 지금 이 순간의 수치 */
export interface HeadlineContent {
  mainLabel: string;
  mainNote: (stats: EduStats) => string;
  /** 보일 지표와 순서 — 개수가 곧 수준 차이다 */
  statIds: StatId[];
  copy?: Partial<Record<StatId, StatCopy>>;
}

export interface SunPathContent {
  head: string;
  note: string;
  notes: EduNote[];
}

export interface DayContent {
  head: string;
  note: (stats: EduStats) => string;
  /** 곡선을 읽는 법 */
  notes: EduNote[];
  /** 햇빛 세기 점선을 함께 그릴지 */
  showIrradiance: boolean;
}

export interface ImpactContent {
  head: string;
  note: (scopeLabel: string, stats: EduStats) => string;
  caption: string;
  itemIds: ImpactId[];
  copy?: Partial<Record<ImpactId, ImpactCopy>>;
  /** 계산 근거 한 줄을 카드에 남길지 */
  showBasis: boolean;
}

export interface JourneyContent {
  head: string;
  note: string;
  topics: EduTopic[];
}

/** 설비 그림에서 지금 들여다보는 자리 */
export type PlantSpot = 'cell' | 'module' | 'inverter' | 'grid';

/**
 * 단계 하나가 담는 것.
 *
 * 같은 자리를 두고 두 가지를 나란히 말한다 — 여기서 **무슨 일이 일어나는가**(태양광 원리)와,
 * AI 는 **그 자리에서 무엇을 보는가**(진단 원리). 둘을 붙여 두어야 학생이 "AI 가 왜 저기를 보는지" 를 안다.
 */
export interface EduAiStage {
  label: string;
  /** 이 단계가 학생에게 가르치는 것 */
  teach: string;
  /** 설비 그림에서 밝아지는 자리 */
  spot: PlantSpot;
  /** 그 자리에서 일어나는 일 */
  physics: string;
  /** AI 가 그 자리에서 보는 것 */
  diagnosis: string;
}

/** AI 가 무엇을 하고 있는지 학생에게 설명하는 말 (고등 전용) */
export interface EduAiContent {
  head: string;
  note: string;
  stages: Record<AnalysisStage, EduAiStage>;
  /** 패널 맨 아래에 남기는 한 줄 — 이 화면이 무엇을 보여 준 것인지 */
  footer: string;
}

// ── 수준별 콘텐츠 ──────────────────────────────────────────

interface EduContentBase {
  /** 멀리서 보는 나이일수록 글씨를 키운다 (SFR-005-04) */
  emphasis: 'normal' | 'large';
  headline: HeadlineContent;
}

/**
 * 초등 — 본문이 한 걸음씩 나아가는 대본이다 (`eduElementary.ts`).
 *
 * 아래를 도는 "알고 계셨나요" 줄을 두지 않는다. 걸음마다 큰 글씨가 이미 한 줄씩 바뀌고 있어,
 * 화면 아래에서 또 다른 글이 따로 돌면 읽을 곳이 둘이 된다.
 */
export interface ElementaryContent extends EduContentBase {
  level: 'elementary';
  /** 세 장의 이름 — 아래 점 네비가 이 순서를 따른다 */
  chapters: { id: string; label: string }[];
  /** 1장 — 전기가 만들어지는 순서 */
  scenes: EduScene[];
  /** 2장 — 오늘 만든 전기로 무엇을 할 수 있나 */
  impact: ElementaryImpact;
  /** 3장 — 태양광은 왜 좋은가 */
  benefits: EduBenefit[];
}

/** 중등 — 원리·발전량·이점 세 카드 (`eduMiddle.ts`) */
export interface MiddleContent extends EduContentBase {
  level: 'middle';
  principle: MiddlePrincipleContent;
  production: MiddleProductionContent;
  benefit: MiddleBenefitContent;
  /** 화면 아래를 도는 "알고 계셨나요" 문구 */
  facts: string[];
}

/** 고등 — 데이터·AI 판단·의미 세 열 */
export interface HighContent extends EduContentBase {
  level: 'high';
  /** 화면 아래를 도는 "알고 계셨나요" 문구 */
  facts: string[];
  sunPath: SunPathContent;
  day: DayContent;
  impact: ImpactContent;
  journey: JourneyContent;
  ai: EduAiContent;
}

export type EduContent = ElementaryContent | MiddleContent | HighContent;

/*
  고등 — 지금까지 쓰던 판.
  비유 대신 물리적 원리와 정량 지표를 쓰고, 단위·계수·계산식을 감추지 않는다.
*/
const HIGH: HighContent = {
  level: 'high',
  emphasis: 'normal',
  headline: {
    mainLabel: '지금 만들고 있는 전기',
    mainNote: (stats) =>
      `가장 셀 때(${formatNumber(stats.capacityKw)}kW)의 ${formatPercent(stats.loadRatio)}만큼 만들고 있어요`,
    statIds: ['today', 'irradiance', 'insolation', 'area'],
  },
  sunPath: {
    head: '해는 하루 동안 이렇게 지나가요',
    note: '햇빛이 기울어 들어오는 각도가 시각마다 달라져요',
    notes: [
      {
        id: 'angle',
        term: '해가 높이 뜰수록 많이 만들어요',
        body:
          '해가 높이 뜨면 햇빛이 판에 똑바로 내리쬐요. 같은 양의 햇빛이 좁은 자리에 모이니 1m² 가 받는 힘이 세지죠. '
          + '정오 무렵에 가장 많이 만드는 이유예요.',
      },
      {
        id: 'airmass',
        term: '아침·저녁엔 공기층을 길게 지나요',
        body:
          '해가 낮게 뜨면 햇빛이 지나야 할 공기층이 두꺼워져요. 그 사이 먼지와 공기에 부딪혀 흩어지면서, '
          + '판에 닿기도 전에 힘이 약해져요.',
      },
    ],
  },
  day: {
    head: '그래서 오늘 이만큼 만들었어요',
    note: (stats) => `하루 모두 ${formatNumber(stats.dayKwh)}kWh · 색이 칠해진 넓이가 만든 양이에요`,
    showIrradiance: true,
    notes: [
      {
        id: 'shape',
        term: '곡선은 해가 지나간 길을 닮았어요',
        body:
          '봉우리가 솟은 자리가 해가 가장 높이 뜬 시각이에요. 옆 그림에서 해가 오르내리는 모양이 '
          + '그대로 곡선이 되죠. 전기의 양을 정하는 건 설비가 아니라 햇빛이에요.',
      },
      {
        id: 'cloud',
        term: '두 선이 같이 내려가면 날씨 때문이에요',
        body:
          '움푹 팬 자리는 대개 구름이 지나간 자리예요. 두 선이 나란히 내려갔다면 날씨 탓이고, '
          + '햇빛은 그대로인데 발전량만 떨어졌다면 먼지나 그늘, 고장을 살펴봐야 해요.',
      },
    ],
  },
  impact: {
    head: '숫자로 보는 의미',
    // 대상 이름의 받침에 따라 조사가 달라지지 않도록 "에서" 로 받는다
    note: (scopeLabel, stats) =>
      `${scopeLabel}에서 오늘 만든 ${formatNumber(stats.dayKwh)}kWh를 다른 것으로 바꿔 보면 이래요`,
    caption: '해를 많이 모은 날일수록 나무가 더 자라요',
    // 가운데 열을 AI 판단에 내주면서 이 칸이 좁아졌다 — 넉 장은 눌려 읽히지 않아 석 장으로 줄인다.
    itemIds: ['co2', 'tree', 'led'],
    showBasis: true,
  },
  journey: {
    head: '햇빛이 전기가 되기까지',
    note: '지붕에서 교실까지 네 단계로 이어져요',
    topics: [
      {
        id: 'principle',
        title: '햇빛이 전기가 되는 원리',
        body:
          '빛 알갱이가 태양전지에 부딪히면 전자가 떨어져 나오고, PN 접합이 그 전자를 한 방향으로 몰아 전류를 만들어요. '
          + '이렇게 얻은 직류를 인버터가 교류로 바꿔 학교로 보내요.',
      },
      {
        id: 'effect',
        title: '무엇이 달라질까요',
        body:
          '여기서 만든 만큼 화력발전소가 덜 돌아가요. 태우지 않은 연료가 곧 줄어든 온실가스이고, '
          + '오른쪽 나무 그루 수는 그 양을 소나무가 1년 동안 마시는 양으로 바꿔 본 거예요.',
      },
    ],
  },
  ai: {
    head: 'AI 가 지금 이 설비를 살펴보고 있어요',
    note: '계측값을 모아 기대치와 견주고, 왜 그런지 문장으로 남깁니다',
    stages: {
      scan: {
        label: '센서 값 모으기',
        teach: 'AI 도 짐작으로 시작하지 않아요. 오늘 하루치 계측값을 먼저 다 읽어요.',
        spot: 'cell',
        physics:
          '빛 알갱이가 태양전지에 부딪히면 붙잡혀 있던 전자가 튀어나와요. PN 접합이 그 전자를 한 방향으로만 '
          + '몰아 주기 때문에 전류가 됩니다. 전기가 만들어지는 자리는 바로 여기예요.',
        diagnosis:
          '진단의 출발점도 여기서 나온 값이에요. AI 는 셀이 만든 전기를 시간대별로 빠짐없이 읽어 들입니다 — '
          + '빠진 값이나 튀는 값이 섞이면 그다음 판단이 통째로 흔들리거든요.',
      },
      classify: {
        label: '정상 범위와 견주기',
        teach: '판단이란 견주는 일이에요. 같은 햇빛이면 얼마가 나와야 하는지와 맞대 봐요.',
        spot: 'module',
        physics:
          '판 여러 장을 한 줄로 이어 전압을 올립니다. 직렬이라 한 장만 그늘이 져도 그 줄 전체가 함께 힘을 잃어요. '
          + '요즘 판에 바이패스 다이오드를 넣는 것도 이 때문이에요.',
        diagnosis:
          'AI 는 오늘 곡선의 모양을 봅니다. 그늘은 한낮 특정 시각만 움푹 패고, 오염은 하루 내내 고르게 낮고, '
          + '구름은 햇빛 곡선까지 같이 내려가요. 모양이 다르니 원인도 가려낼 수 있습니다.',
      },
      reason: {
        label: '왜 그런지 풀어 보기',
        teach: '숫자만 내놓으면 사람이 쓸 수 없어요. 벌어진 까닭을 문장으로 적어요.',
        spot: 'inverter',
        physics:
          '판이 만든 직류를 인버터가 교류로 바꿔 학교로 보냅니다. 이때 전압과 전류의 곱이 가장 큰 지점을 '
          + '계속 좇아가며(MPPT) 버려지는 전기를 줄여요.',
        diagnosis:
          '기대치와 벌어진 폭을 일사·온도·변환 효율로 나눠 봅니다. 어느 몫이 얼마나 새는지까지 갈라 놓아야 '
          + '사람이 어디를 손볼지 알 수 있어요.',
      },
      done: {
        label: '진단 끝',
        teach: '무엇을 보고 그렇게 판단했는지 근거를 남겨야 사람이 확인할 수 있어요.',
        spot: 'grid',
        physics:
          '만든 전기는 학교가 먼저 씁니다. 쓰는 곳에서 바로 만드니 멀리 보내며 잃는 몫이 없고, '
          + '남으면 바깥 전기망으로 흘러나가 다른 곳에서 쓰여요.',
        diagnosis:
          '판단과 함께 근거를 문장으로 남깁니다. 왜 그렇게 봤는지 없이 경보만 울리면 사람이 믿지 않고, '
          + '믿지 않는 진단은 고장을 못 고쳐요.',
      },
    },
    footer: '전국의 태양광 발전소를 이 방법으로 하루에 한 번씩 살펴봅니다.',
  },
  facts: [
    '태양전지는 뜨거울수록 효율이 떨어져요. 한여름보다 볕 좋은 봄가을에 더 잘 만드는 까닭이에요.',
    '판에 쌓인 먼지는 발전량을 몇 %씩 갉아먹어요. 비가 한 번 내리면 그만큼 회복돼요.',
    '직렬로 이은 판 하나에 그늘이 지면 그 줄 전체가 함께 힘을 잃어요.',
    '요즘 판에는 바이패스 다이오드가 들어 있어, 그늘진 칸을 건너뛰고 전기를 흘려 보내요.',
    'kW 는 지금 이 순간의 힘, kWh 는 그 힘으로 쌓은 양이에요. 속도와 거리의 관계와 같아요.',
  ],
};

export const EDU_CONTENT: Record<EduLevel, EduContent> = {
  elementary: ELEMENTARY_CONTENT,
  middle: MIDDLE_CONTENT,
  high: HIGH,
};

export function getEduContent(level: EduLevel): EduContent {
  return EDU_CONTENT[level];
}

/** 지표 한 줄에 수준별 덮어쓰기를 얹어 낸다. */
export function statOf(id: StatId, copy?: StatCopy): StatDef {
  return copy ? { ...STAT_DEFS[id], ...copy } : STAT_DEFS[id];
}

/** 환산 카드 한 장에 수준별 덮어쓰기를 얹어 낸다. */
export function impactOf(id: ImpactId, copy?: ImpactCopy): ImpactDef {
  return copy ? { ...IMPACT_DEFS[id], ...copy } : IMPACT_DEFS[id];
}
