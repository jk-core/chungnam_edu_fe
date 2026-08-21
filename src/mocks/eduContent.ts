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

/**
 * 학교급이 곧 눈높이다. 유치원과 특수학교는 가장 쉽게 읽히는 초등 판을 쓰고,
 * 학생이 상주하지 않는 교육기관은 정보가 가장 많은 고등 판으로 둔다.
 */
const BY_SCHOOL_LEVEL: Record<SchoolLevel, EduLevel> = {
  유치원: 'elementary',
  초등학교: 'elementary',
  중학교: 'middle',
  고등학교: 'high',
  특수학교: 'elementary',
  교육기관: 'high',
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

export type StatId = 'today' | 'insolation' | 'co2' | 'irradiance' | 'capacity';

export interface StatDef {
  label: string;
  value: (stats: EduStats) => number;
  unit: string;
  fractionDigits: number;
  /** 단위를 몰라도 크기를 가늠할 수 있게 하는 한 줄 */
  note: (stats: EduStats) => string;
}

/*
  지표 이름은 세 수준이 모두 같은 말을 쓴다.

  전에는 수준마다 이름을 달리 붙였는데(「해를 모은 시간」 · 「발전시간」), 같은 값을 교과서나 다른
  자료에서 다시 만났을 때 같은 것인 줄 알아보지 못한다. 이름은 표준 용어로 고정하고, 무슨 뜻인지는
  아래 붙는 설명 한 줄이 수준에 맞춰 풀어 준다 — 어려운 것은 말이지 개념이 아니다.

  기본 문구는 서술체다. 초등만 「~해요」 로 덮어쓴다.
*/
export const STAT_DEFS: Record<StatId, StatDef> = {
  today: {
    label: '금일 발전량',
    value: (stats) => stats.todayKwh,
    unit: 'kWh',
    fractionDigits: 0,
    note: (stats) => `4인 가구 ${formatNumber(kwhToHouseholdDays(stats.todayKwh))}가구의 하루 사용량에 해당한다`,
  },
  irradiance: {
    label: '일사강도',
    value: (stats) => (stats.irradianceNow / FULL_SUN_WM2) * 100,
    unit: '점',
    fractionDigits: 0,
    note: (stats) => `${formatNumber(stats.irradianceNow)} W/m². 맑은 날 정오의 햇빛 1,000W/m² 를 100점으로 놓고 환산한 값이다`,
  },
  insolation: {
    label: '발전시간',
    value: (stats) => stats.equivalentHours,
    unit: '시간',
    fractionDigits: 1,
    note: () => '발전량을 설비용량으로 나눈 값이다. 설비 크기가 달라도 서로 비교할 수 있다',
  },
  co2: {
    label: '탄소 저감량',
    value: (stats) => stats.todayKwh * CO2_PER_KWH,
    unit: 'kg',
    fractionDigits: 0,
    note: () => `배출계수 ${CO2_PER_KWH}kgCO₂/kWh 를 적용했다`,
  },
  /*
    설비용량.
    처음에는 모듈 넓이를 적었는데 그 값은 실제로 들어오지 않는 수였다 — 화면에 있으면
    있는 값처럼 읽히므로 걷어내고, 대신 이 학교 설비가 얼마나 큰지를 적는다.
  */
  capacity: {
    label: '설비용량',
    value: (stats) => stats.capacityKw,
    unit: 'kW',
    fractionDigits: 1,
    note: () => '설치된 모듈이 한꺼번에 낼 수 있는 최대 출력이다',
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
  /**
   * 이 환산이 왜 좋은 일인지 한 줄.
   *
   * `basis` 가 "어떻게 셈했나" 라면 이쪽은 "그래서 뭐가 좋은가" 다. 값과 근거만 있으면 표가 되고,
   * 이 한 줄이 붙어야 설명이 된다 — 걸어 두는 화면의 목적이 그것이다.
   */
  line: string;
}

export const IMPACT_DEFS: Record<ImpactId, ImpactDef> = {
  co2: {
    label: '탄소 저감량',
    perKwh: CO2_PER_KWH,
    unit: 'kg CO₂',
    basis: `전기 1kWh 를 만들 때 평균 ${CO2_PER_KWH}kg 의 탄소가 나온다고 보고 계산했다`,
    fractionDigits: 0,
    line: '여기서 만든 만큼 화력발전소가 덜 돌아가고, 그만큼 석탄과 가스를 태우지 않아도 된다',
  },
  tree: {
    label: '소나무로 환산하면',
    // 줄인 CO₂ 를 소나무가 1년 동안 마시는 양으로 나눈다. 계수는 utils/eco 와 한 곳을 본다.
    perKwh: CO2_PER_KWH / CO2_PER_TREE_YEAR,
    unit: '그루',
    basis: `소나무 한 그루가 1년에 ${CO2_PER_TREE_YEAR}kg 을 흡수한다고 보고 계산했다`,
    fractionDigits: 0,
    line: '줄인 탄소를 소나무가 1년에 흡수하는 양으로 나눈 값이다. 소나무를 몇 그루 심은 것과 같은 효과인지 보여 준다',
  },
  household: {
    label: '4인 가구 사용일수',
    perKwh: 1 / (350 / 30),
    unit: '일',
    basis: '4인 가구 한 곳이 하루에 11.7kWh 를 쓴다고 보고 계산했다',
    fractionDigits: 1,
    line: '4인 가구 한 곳이 며칠 동안 쓸 수 있는 양인지 계산한 값이다',
  },
  led: {
    label: '교실 조명 점등 시간',
    perKwh: 25,
    unit: '시간',
    basis: '40W 짜리 조명 하나를 계속 켜 둔다고 보고 계산했다',
    fractionDigits: 0,
    line: '교실 조명 하나를 쉬지 않고 켜 둘 수 있는 시간이다',
  },
};

/** 수준이 덮어쓸 수 있는 부분만 */
export interface ImpactCopy {
  label?: string;
  line?: string;
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
    mainLabel: '실시간 출력',
    mainNote: (stats) =>
      `설비용량 ${formatNumber(stats.capacityKw)}kW 로 낼 수 있는 최대치의 ${formatPercent(stats.loadRatio)} 를 내고 있다`,
    statIds: ['today', 'insolation', 'co2', 'irradiance', 'capacity'],
    // 기본 문구가 이미 서술체이자 표준 용어라 덮어쓸 것이 없다.
  },
  sunPath: {
    head: '태양의 하루 경로',
    note: '햇빛이 들어오는 각도는 시각마다 달라진다',
    notes: [
      {
        id: 'angle',
        term: '고도가 높을수록 발전량이 늘어난다',
        body:
          '태양 고도가 높으면 햇빛이 모듈에 가깝게 수직으로 들어온다. 같은 양의 빛이 좁은 면적에 모이므로 '
          + '1m² 가 받는 에너지가 커진다. 정오 무렵에 발전량이 가장 큰 이유다.',
      },
      {
        id: 'airmass',
        term: '아침·저녁에는 통과하는 대기층이 두꺼워진다',
        body:
          '태양 고도가 낮으면 햇빛이 지나야 할 대기층이 길어진다. 그 사이 먼지와 공기 분자에 산란되어, '
          + '모듈에 닿기 전에 이미 에너지를 잃는다.',
      },
    ],
  },
  day: {
    head: '금일 시간대별 발전량',
    note: (stats) => `하루 합계 ${formatNumber(stats.dayKwh)}kWh. 색이 칠해진 면적이 발전량이다`,
    showIrradiance: true,
    notes: [
      {
        id: 'shape',
        term: '곡선의 모양은 태양 경로를 따라간다',
        body:
          '차트가 가장 높은 시각이 태양이 가장 높이 뜬 때다. 옆 그림의 태양 고도 변화가 그대로 차트 모양이 된다. '
          + '발전량을 정하는 것은 설비 성능이 아니라 그 시각에 들어온 햇빛의 양이다.',
      },
      {
        id: 'cloud',
        term: '두 선이 같이 내려갔다면 날씨 때문이다',
        body:
          '차트가 잠깐 뚝 떨어진 구간은 대개 구름이 해를 잠시 가린 순간이다. 일사량 선까지 같이 내려갔다면 '
          + '날씨 때문이고, 일사량은 그대로인데 발전량만 떨어졌다면 표면 오염·그늘·고장을 살펴야 한다.',
      },
    ],
  },
  impact: {
    head: '환산해 본 의미',
    // 대상 이름의 받침에 따라 조사가 달라지지 않도록 "에서" 로 받는다
    note: (scopeLabel, stats) =>
      `${scopeLabel}에서 오늘 만든 ${formatNumber(stats.dayKwh)}kWh 가 어느 정도인지 익숙한 단위로 바꾸면 이만큼이다`,
    caption: '발전시간이 길었던 날일수록 이 값들도 함께 커진다',
    // 가운데 열을 AI 판단에 내주면서 이 칸이 좁아졌다 — 넉 장은 눌려 읽히지 않아 석 장으로 줄인다.
    itemIds: ['co2', 'tree', 'led'],
    showBasis: true,
  },
  journey: {
    head: '햇빛이 전기가 되기까지',
    note: '지붕에서 교실까지 네 단계로 이어진다',
    topics: [
      {
        id: 'principle',
        title: '발전 원리',
        body:
          '태양전지가 빛을 흡수하면 전자가 여기되어 자유로워지고, PN 접합의 전위차가 그 전자를 한 방향으로 '
          + '이동시켜 전류를 만든다(광기전력 효과). 이렇게 얻은 직류를 인버터가 교류로 변환해 학교로 보낸다.',
      },
      {
        id: 'effect',
        title: '무엇이 달라지는가',
        body:
          '여기서 생산한 만큼 화력발전소의 가동이 줄어든다. 태우지 않은 연료가 곧 줄어든 온실가스이고, '
          + '오른쪽 그루 수는 그 양을 소나무가 1년 동안 흡수하는 양으로 환산한 값이다.',
      },
    ],
  },
  ai: {
    head: '햇빛이 전기가 되기까지, 단계마다 무슨 일이 일어나는가',
    note: '태양전지 셀에서 계통까지 네 단계를 차례로 살펴본다. 각 단계에서 AI 가 무엇을 보는지도 함께 적었다',
    stages: {
      scan: {
        label: '계측값 수집',
        teach: '진단은 추정이 아니라 관측에서 출발한다. 하루치 계측값을 빠짐없이 읽어 들인다.',
        spot: 'cell',
        physics:
          '태양전지가 빛을 흡수하면 반도체 안의 전자가 에너지를 얻어 자유로워진다. PN 접합의 전위차가 그 전자를 '
          + '한 방향으로만 이동시키므로 전류가 된다. 발전이 실제로 일어나는 지점이 여기다.',
        diagnosis:
          '진단의 출발점도 여기서 나온 값이다. 셀이 생산한 전력을 시간대별로 빠짐없이 읽어 들인다 — '
          + '빠진 값이나 튀는 값이 섞이면 그 뒤의 판단이 전부 어긋난다.',
      },
      classify: {
        label: '정상 범위와 대조',
        teach: '판단은 비교에서 나온다. 같은 햇빛 조건이라면 나와야 할 값과 실제 측정값을 비교한다.',
        spot: 'module',
        physics:
          '모듈 여러 장을 직렬로 이어 전압을 높인다. 직렬이므로 한 장에만 음영이 져도 스트링 전체의 출력이 '
          + '함께 떨어진다. 모듈에 바이패스 다이오드를 넣는 것도 이 때문이다.',
        diagnosis:
          '금일 발전 곡선의 형상을 본다. 음영은 특정 시각만 국소적으로 패이고, 오염은 하루 내내 고르게 낮으며, '
          + '구름은 일사량 곡선까지 함께 내려간다. 형상이 다르므로 원인을 구분할 수 있다.',
      },
      reason: {
        label: '편차 원인 분해',
        teach: '숫자만 있으면 무엇을 해야 할지 알 수 없다. 기대치와 차이가 난 이유를 문장으로 적어 남긴다.',
        spot: 'inverter',
        physics:
          '모듈이 생산한 직류를 인버터가 교류로 변환해 학교로 보낸다. 이때 전압과 전류의 곱이 최대가 되는 '
          + '지점을 계속 추종하여(MPPT) 손실을 줄인다.',
        diagnosis:
          '기대치와의 편차를 일사·온도·변환 효율의 몫으로 나눈다. 어느 항목에서 얼마가 새는지까지 갈라 놓아야 '
          + '어디를 손볼지 정할 수 있다.',
      },
      done: {
        label: '판정 및 근거 기록',
        teach: '무엇을 근거로 그렇게 판단했는지가 남아야 사람이 확인할 수 있다.',
        spot: 'grid',
        physics:
          '생산한 전력은 학교가 우선 소비한다. 수용가에서 바로 생산하므로 송전 손실이 없고, '
          + '남은 전력은 계통으로 역송되어 다른 곳에서 쓰인다.',
        diagnosis:
          '판정과 함께 근거를 문장으로 남긴다. 근거 없이 경보만 울리면 사람이 신뢰하지 않고, '
          + '사람이 믿지 못하는 진단은 실제 조치로 이어지지 않는다.',
      },
    },
    footer: '전국의 태양광 발전소를 이 절차로 하루 한 번 점검한다.',
  },
  facts: [
    '태양전지는 온도가 높을수록 효율이 떨어진다. 일사량이 가장 큰 한여름에 오히려 효율이 떨어지는 이유다.',
    '모듈 표면에 먼지가 쌓이면 발전량이 몇 % 씩 줄어든다. 비가 한 번 내리면 그만큼 회복된다.',
    '직렬로 이은 모듈 하나에만 그늘이 져도 스트링 전체의 출력이 그 모듈에 맞춰 함께 떨어진다.',
    '모듈에 든 바이패스 다이오드는 음영이 진 셀 구간을 우회해 전류를 흘려보낸다.',
    'kW 는 순간의 출력, kWh 는 그 출력으로 쌓은 양이다. 속도와 거리의 관계와 같다.',
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
