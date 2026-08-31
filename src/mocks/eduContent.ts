import { CO2_PER_KWH, CO2_PER_TREE_YEAR, kwhToHouseholdDays } from '@/utils/eco';
import { formatCapacity, formatEnergy, formatNumber, scaleCarbon, scaleSi } from '@/utils/format';
import type { AnalysisStage } from '@/interface/diagnosis';
import type { EduLevel } from '@/interface/edu';
import type { School, SchoolLevel } from '@/interface/energy';
import type { SiScale } from '@/utils/format';
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
  /**
   * 자릿수가 커지면 단위를 올려 보일 값인지.
   *
   * 도 전체를 합치면 kW·kWh 로는 다섯 자리를 넘겨 칸 밖으로 나간다. 여기에 종류만 적어 두면
   * 그리는 쪽이 `statFigure` 로 M·G·t 까지 올려 준다. 발전시간(시간)·일사강도(점)처럼
   * SI 가 아닌 값은 적지 않는다.
   */
  scale?: 'W' | 'Wh' | 'carbon';
  /** `scale` 이 없을 때 그대로 붙는 단위 */
  unit: string;
  fractionDigits: number;
  /** 단위를 몰라도 크기를 가늠할 수 있게 하는 한 줄 */
  note: (stats: EduStats) => string;
}

/**
 * 지표 한 칸에 실제로 그릴 숫자와 단위.
 * 숫자를 굴려 올리는 곳도 그대로 쓸 수 있게 문자열이 아니라 값으로 돌려준다.
 */
export function statFigure(def: StatDef, stats: EduStats): SiScale {
  const raw = def.value(stats);

  if (def.scale === 'carbon') return scaleCarbon(raw);
  if (def.scale) return scaleSi(raw, def.scale);

  return { amount: raw, unit: def.unit, fractionDigits: def.fractionDigits };
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
    scale: 'Wh',
    unit: 'kWh',
    fractionDigits: 0,
    note: (stats) => `4인 가구 ${formatNumber(kwhToHouseholdDays(stats.todayKwh))}가구가 하루에 쓰는 양이다`,
  },
  irradiance: {
    label: '일사강도',
    value: (stats) => (stats.irradianceNow / FULL_SUN_WM2) * 100,
    unit: '점',
    fractionDigits: 0,
    note: (stats) => `맑은 날 정오의 햇빛을 100점으로 놓고 본 값이다 (${formatNumber(stats.irradianceNow)} W/m²)`,
  },
  insolation: {
    label: '발전시간',
    value: (stats) => stats.equivalentHours,
    unit: '시간',
    fractionDigits: 1,
    note: () => '발전량을 설비용량으로 나눈 값이다. 설비 크기가 달라도 견줄 수 있다',
  },
  co2: {
    label: '탄소 저감량',
    value: (stats) => stats.todayKwh * CO2_PER_KWH,
    scale: 'carbon',
    unit: 'kg',
    fractionDigits: 0,
    note: () => '화석연료로 만들었을 때와 견주어 줄어든 양이다',
  },
  /*
    설비용량.
    처음에는 모듈 넓이를 적었는데 그 값은 실제로 들어오지 않는 수였다 — 화면에 있으면
    있는 값처럼 읽히므로 걷어내고, 대신 이 학교 설비가 얼마나 큰지를 적는다.
  */
  capacity: {
    label: '설비용량',
    value: (stats) => stats.capacityKw,
    scale: 'W',
    unit: 'kW',
    fractionDigits: 1,
    note: () => '한꺼번에 낼 수 있는 가장 큰 출력이다',
  },
};

/*
  문장 안에 수치를 넣을 때 쓰는 표기.
  큰 숫자만 M·G 로 올리고 문장 속 수치는 kW 로 두면, 같은 화면에서 같은 값이 두 단위로 읽힌다.
*/

/** 설비용량을 문장에 넣을 때 — 「18.8MW」 */
export function capacityText(stats: EduStats): string {
  const { value, unit } = formatCapacity(stats.capacityKw);

  return `${value}${unit}`;
}

/** 발전량을 문장에 넣을 때 — 「74.2MWh」 */
export function energyText(kwh: number): string {
  const { value, unit } = formatEnergy(kwh);

  return `${value}${unit}`;
}

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
  /** 자릿수가 커지면 단위를 올려 보일 값인지 — 그루·일·시간처럼 SI 가 아닌 값은 적지 않는다 */
  scale?: 'carbon';
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
    scale: 'carbon',
    unit: 'kg CO₂',
    basis: `전기 1kWh 를 화석연료로 만들 때 나오는 ${CO2_PER_KWH}kg 기준`,
    fractionDigits: 0,
    line: '여기서 만든 만큼 화석연료 발전이 줄어, 그만큼 석탄과 가스를 태우지 않아도 된다',
  },
  tree: {
    label: '소나무로 환산하면',
    // 줄인 CO₂ 를 소나무가 1년 동안 마시는 양으로 나눈다. 계수는 utils/eco 와 한 곳을 본다.
    perKwh: CO2_PER_KWH / CO2_PER_TREE_YEAR,
    unit: '그루',
    basis: `소나무 한 그루가 1년에 흡수하는 ${CO2_PER_TREE_YEAR}kg 기준`,
    fractionDigits: 0,
    line: '줄인 탄소를 소나무가 1년에 흡수하는 양으로 나눈 값이다. 소나무를 몇 그루 심은 것과 같다',
  },
  household: {
    label: '4인 가구 사용일수',
    perKwh: 1 / (350 / 30),
    unit: '일',
    basis: '4인 가구가 하루에 쓰는 11.7kWh 기준',
    fractionDigits: 1,
    line: '4인 가구 한 집이 며칠 동안 쓸 수 있는 양인지 나눠 본 값이다',
  },
  led: {
    label: '교실 조명 점등 시간',
    perKwh: 25,
    unit: '시간',
    basis: '40W 조명 기준',
    fractionDigits: 0,
    line: '교실 조명 하나를 쉬지 않고 켜 둘 수 있는 시간이다',
  },
};

/** 수준이 덮어쓸 수 있는 부분만 */
export interface ImpactCopy {
  label?: string;
  line?: string;
}

/**
 * 환산 카드 한 장에 실제로 그릴 숫자와 단위.
 * 탄소는 도 전체를 합치면 t 이 되므로 「kg CO₂」 의 앞머리만 갈아 끼운다.
 */
export function impactFigure(def: ImpactDef, dayKwh: number): SiScale {
  const raw = dayKwh * def.perKwh;

  if (def.scale === 'carbon') {
    const scaled = scaleCarbon(raw);

    return { ...scaled, unit: `${scaled.unit} CO₂` };
  }

  return { amount: raw, unit: def.unit, fractionDigits: def.fractionDigits };
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
 * 전기가 만들어져 흘러가는 차례.
 * 그림에 늘어놓는 순서이자 단계별 설명을 읽는 순서다 — 두 곳이 같은 배열을 봐야 어긋나지 않는다.
 */
export const PLANT_SPOTS: PlantSpot[] = ['cell', 'module', 'inverter', 'grid'];

/** 자리마다의 이름. 그림의 겨냥 표시와 단계 차례표가 같은 말을 쓴다. */
export const PLANT_SPOT_LABEL: Record<PlantSpot, string> = {
  cell: '태양전지 셀',
  module: '모듈 · 스트링',
  inverter: '인버터',
  grid: '학교',
};

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
  고등 — 세 판 가운데 가장 많은 것을 보여 주는 판.

  한때 물리 용어와 계산식을 그대로 적었는데(PN 접합·광기전력 효과·공기질량·MPPT·바이패스 다이오드),
  고등학생이 걸음을 멈추고 읽기에는 어려워 읽히지 않았다. 그래서 다루는 개념은 그대로 두고
  말만 중학교 과학 수준으로 낮췄다 — 덜어낸 것은 지식이 아니라 전문 용어다 (2026-08-31 검토 의견).

  한 번 낮추고도 여전히 어렵다는 지적을 받아 같은 날 한 차례 더 훑었다. 두 번째로 걷어낸 것은
  **중학교 교과 밖의 말**과 **풀지 않고 쓰던 말**이다 — 반도체를 걷어 전자의 움직임만 남기고,
  직류·교류는 그 자리에서 무엇이 다른지 함께 적고, 셀·모듈·스트링은 서로 어떤 관계인지 한 번 밝힌다.
  남은 말은 중2 과학의 전자·전류·전압·직렬까지다.

  문체는 서술체, 지표 이름은 표준 용어 그대로다. 쉬워져야 할 것은 설명이지 이름이 아니다.
*/
const HIGH: HighContent = {
  level: 'high',
  emphasis: 'normal',
  headline: {
    mainLabel: '실시간 출력',
    mainNote: (stats) =>
      `설비용량 ${capacityText(stats)} 로 낼 수 있는 최대치 가운데 지금 내고 있는 출력이다`,
    statIds: ['today', 'insolation', 'co2', 'irradiance', 'capacity'],
    // 기본 문구가 이미 이 눈높이에 맞춰져 있어 덮어쓸 것이 없다.
  },
  sunPath: {
    head: '태양의 하루 고도',
    note: '햇빛이 들어오는 각도는 시각마다 달라진다',
    notes: [
      {
        id: 'angle',
        term: '고도가 높을수록 발전량이 는다',
        body: '태양이 높이 뜨면 햇빛이 모듈에 수직에 가깝게 내리쬐어, 같은 빛이 좁은 면적에 모인다.',
      },
      {
        id: 'airmass',
        term: '아침·저녁에는 공기층을 길게 지난다',
        body: '지나는 동안 먼지와 공기에 부딪혀 흩어져, 모듈에 닿을 때는 이미 힘이 줄어 있다.',
      },
    ],
  },
  day: {
    head: '금일 시간대별 발전량',
    note: (stats) => `하루 합계 ${energyText(stats.dayKwh)}. 색이 칠해진 면적이 발전량이다`,
    showIrradiance: true,
    notes: [
      {
        id: 'shape',
        term: '곡선의 모양은 태양의 고도와 같다',
        body: '발전량을 정하는 것은 설비 성능이 아니라 그 시각에 들어온 햇빛의 양이다.',
      },
      {
        id: 'cloud',
        term: '같이 떨어졌다면 날씨 때문이다',
        body: '일사강도는 그대로인데 발전량만 떨어졌다면 오염·그늘·고장을 살펴야 한다.',
      },
    ],
  },
  impact: {
    head: '환산해 본 의미',
    // 대상 이름의 받침에 따라 조사가 달라지지 않도록 "에서" 로 받는다
    note: (scopeLabel, stats) =>
      `${scopeLabel}에서 오늘 만든 ${energyText(stats.dayKwh)} 가 어느 정도인지 아는 것으로 바꿔 보면 이렇다`,
    caption: '발전시간이 길었던 날일수록 이 값들도 함께 커진다',
    // 가운데 열을 AI 판단에 내주면서 이 칸이 좁아졌다 — 넉 장은 눌려 읽히지 않아 석 장으로 줄인다.
    itemIds: ['co2', 'tree', 'led'],
    /*
      계산 근거 줄은 걷어냈다 (2026-08-31 검토 의견).
      「배출계수 0.4594kgCO₂/kWh 기준」 같은 줄은 눈높이를 중학교 수준으로 내리면서 남길 자리가
      아니고, 무엇을 어떻게 셈했는지는 카드마다 붙는 한 줄과 아래 캡션이 이미 말한다.
      비운 세 줄만큼 아래 계통 칸이 제 높이를 되찾기도 한다 — 글씨를 키운 뒤로는 그쪽이 잘렸다.
    */
    showBasis: false,
  },
  journey: {
    head: '햇빛이 전기가 되기까지',
    note: '지붕에서 교실까지 네 단계로 이어진다',
    topics: [
      {
        id: 'principle',
        title: '발전 원리',
        body: '태양전지에 햇빛이 닿으면 그 안의 전자가 움직여 전류가 흐른다.',
      },
      {
        id: 'effect',
        title: '무엇이 달라지는가',
        body: '여기서 만든 만큼 화력발전소가 덜 돌아가고, 태우지 않은 연료가 곧 줄어든 온실가스다.',
      },
    ],
  },
  ai: {
    head: '햇빛이 전기가 되기까지, 단계마다 무슨 일이 일어나는가',
    note: '태양전지에서 학교까지, 전기가 만들어져 흘러가는 네 곳을 차례로 살펴본다',
    stages: {
      scan: {
        label: '계측값 수집',
        teach: '진단은 짐작이 아니라 실제로 잰 값에서 출발한다. 하루치 계측값을 빠짐없이 읽어 들인다.',
        spot: 'cell',
        /*
          첫 문장이 이 자리에서 일어나는 일을 통째로 말한다.
          시안 D 는 자리마다 한 줄만 적을 자리밖에 없어 이 첫 문장만 떼어 쓴다 —
          같은 말을 두 곳에 적어 두지 않으려면 첫 문장이 홀로 서야 한다.
        */
        physics:
          '태양전지는 햇빛을 받으면 전기가 한 방향으로 흐르도록 만든 얇은 판이다. 빛이 닿으면 그 안의 '
          + '전자가 에너지를 얻어 움직이기 시작하고, 전자가 줄지어 흐르는 것이 곧 전류다. '
          + '발전이 실제로 일어나는 자리가 여기다.',
        diagnosis:
          '진단도 여기서 나온 값에서 시작한다. 셀이 만든 전력을 시간대별로 빠짐없이 읽어 들인다 — '
          + '빠진 값이나 튀는 값이 섞이면 그 뒤의 판단이 모두 어긋난다.',
      },
      classify: {
        label: '정상 범위와 대조',
        teach: '판단은 비교에서 나온다. 같은 햇빛이라면 나와야 할 값과 실제로 잰 값을 견준다.',
        spot: 'module',
        physics:
          '태양전지 여러 장을 이어 붙인 것이 모듈, 모듈을 직렬로 이은 한 줄이 스트링이다. '
          + '직렬이라 한 장에만 그늘이 져도 그 줄 전체의 출력이 함께 떨어진다.',
        diagnosis:
          '금일 발전 곡선의 모양을 본다. 그늘은 특정 시각만 움푹 패이고, 표면 오염은 하루 내내 고르게 낮으며, '
          + '구름은 일사강도 곡선까지 함께 내려간다. 모양이 다르므로 원인을 가릴 수 있다.',
      },
      reason: {
        label: '차이가 난 이유 찾기',
        teach: '숫자만 있으면 무엇을 해야 할지 알 수 없다. 기대한 값과 차이가 난 이유를 문장으로 적어 남긴다.',
        spot: 'inverter',
        physics:
          '모듈이 만든 전기는 한 방향으로만 흐르는 직류다. 교실 콘센트에 오는 전기는 방향이 계속 바뀌는 '
          + '교류라, 그대로는 쓸 수 없다. 인버터가 직류를 교류로 바꿔 학교로 보낸다.',
        diagnosis:
          '기대한 값과 벌어진 차이를 햇빛·온도·인버터 변환 가운데 어느 쪽 몫인지로 갈라 본다. '
          + '어디서 얼마가 새는지까지 갈라 놓아야 어디를 손볼지 정할 수 있다.',
      },
      done: {
        label: '판정과 근거 남기기',
        teach: '무엇을 근거로 그렇게 판단했는지가 남아야 사람이 확인할 수 있다.',
        spot: 'grid',
        physics:
          '만든 전기는 학교가 그대로 쓴다. 쓰는 곳에서 바로 만드니 멀리 보내며 잃는 전기가 없고, '
          + '그만큼 밖에서 사 오는 전기가 줄어든다.',
        diagnosis:
          '판정과 함께 그렇게 본 근거를 문장으로 남긴다. 근거 없이 경보만 울리면 사람이 믿지 않고, '
          + '믿지 못하는 진단은 실제 조치로 이어지지 않는다.',
      },
    },
    footer: '전국의 태양광 발전소를 이 절차로 하루 한 번 점검한다.',
  },
  facts: [
    '태양전지는 온도가 높으면 효율이 떨어진다. 그래서 한여름보다 볕 좋은 봄·가을에 발전량이 더 나온다.',
    '모듈에 먼지가 쌓이면 발전량이 줄어들고, 비가 내려 씻기면 다시 회복된다.',
    '직렬로 이은 모듈 하나에만 그늘이 져도 그 줄 전체의 출력이 함께 떨어진다.',
    '지붕에 설치하면 따로 땅이 들지 않고, 여름에는 지붕에 그늘을 만들어 건물 온도도 낮춰 준다.',
    'kW 는 지금 이 순간의 힘, kWh 는 그 힘으로 일정 시간 동안 만든 전기의 양이다. 속도와 거리의 관계와 같다.',
    '1,000kW 는 1MW, 1,000MW 는 1GW 다. 여러 학교를 합쳐 보면 단위가 이렇게 올라간다.',
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
