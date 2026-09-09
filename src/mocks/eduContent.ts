import { CO2_PER_KWH, CO2_PER_TREE_YEAR, kwhToHouseholdDays } from '@/utils/eco';
import { formatCapacity, formatEnergy, formatNumber, scaleCarbon, scaleKoCount, scaleSi } from '@/utils/format';
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

export type StatId = 'today' | 'total' | 'powerTime' | 'co2' | 'irradiance' | 'capacity';

export interface StatDef {
  label: string;
  value: (stats: EduStats) => number;
  /**
   * 자릿수가 커지면 단위를 올려 보일 값인지.
   *
   * 도 전체를 합치면 kW·kWh 로는 다섯 자리를 넘겨 칸 밖으로 나간다. 여기에 종류만 적어 두면
   * 그리는 쪽이 `statFigure` 로 M·G·t 까지 올려 준다. 발전시간(시간)·일사량(점)처럼
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
    note: (stats) => `4인 가구 ${formatNumber(kwhToHouseholdDays(stats.todayKwh))}집분`,
  },
  /*
    누적 발전량 (2026-09-04 회의).

    금일만 보이면 인버터가 멎거나 통신이 끊긴 날 화면의 모든 값이 0 이 된다. 누적은 그런 날에도
    남아 있고 수치가 커서 임팩트도 크다 — 그래서 환산 지표(나무·조명 따위)의 기준도 이쪽으로 옮겼다.
  */
  total: {
    label: '누적 발전량',
    value: (stats) => stats.totalKwh,
    scale: 'Wh',
    unit: 'kWh',
    fractionDigits: 0,
    note: () => '설치 후 누적',
  },
  /*
    「일사강도」 가 아니라 「일사량」 으로 부른다 (2026-09-04 회의).
    과학 교과와 맞추는 이름이고, 점수 옆에 실제 수치와 단위(W/m²)를 함께 노출한다.
  */
  irradiance: {
    label: '일사량',
    value: (stats) => (stats.irradianceNow / FULL_SUN_WM2) * 100,
    unit: '점',
    fractionDigits: 0,
    note: () => '맑은 날 정오가 100점',
  },
  powerTime: {
    label: '발전시간',
    value: (stats) => stats.equivalentHours,
    unit: '시간',
    fractionDigits: 1,
    note: () => '발전량 ÷ 설비용량',
  },
  co2: {
    label: '탄소 저감량',
    value: (stats) => stats.todayKwh * CO2_PER_KWH,
    scale: 'carbon',
    unit: 'kg',
    fractionDigits: 0,
    note: () => '화석연료 대비 감축분',
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
    note: () => '설비 최대 출력',
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

/**
 * 수준이 덮어쓸 수 있는 부분만.
 *
 * 대개는 이름과 설명 한 줄이면 된다 — 같은 값을 눈높이에 맞게 풀어 말할 뿐이다.
 * 값과 단위까지 열어 둔 것은 **재는 방식 자체가 눈높이를 따라 갈리는 지표**가 있기 때문이다
 * (일사량: 초·중등은 점수, 고등은 잰 값). 이름은 여전히 세 판이 같은 표준 용어를 쓴다.
 */
export interface StatCopy {
  label?: string;
  note?: (stats: EduStats) => string;
  value?: (stats: EduStats) => number;
  unit?: string;
  fractionDigits?: number;
}

// ── 환산 레지스트리 ────────────────────────────────────────

export type ImpactId = 'co2' | 'tree' | 'household' | 'led';

export interface ImpactDef {
  label: string;
  /** 1kWh 당 환산값 */
  perKwh: number;
  /**
   * 자릿수가 커지면 단위를 올려 보일 값인지.
   *
   * 기준을 누적으로 옮기고 나서 필요해졌다 — 하루치로 「6,360일」 이던 값이 「9,514,692일」 이 되면
   * 자릿수를 세다 읽기를 포기한다. 그루처럼 그대로 세는 편이 나은 것은 적지 않는다.
   */
  scale?: 'carbon' | 'days' | 'hours';
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
    scale: 'days',
    unit: '일',
    basis: '4인 가구가 하루에 쓰는 11.7kWh 기준',
    fractionDigits: 1,
    line: '4인 가구 한 집이 며칠 동안 쓸 수 있는 양인지 나눠 본 값이다',
  },
  led: {
    label: '교실 조명 점등 시간',
    perKwh: 25,
    scale: 'hours',
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
 *
 * 기준은 **누적 발전량**이다 (2026-09-04 회의). 금일로 세면 인버터가 멎은 날 넉 장이 모두 0 이
 * 되는데, 걸어 두는 화면에서 그것은 「오늘 아무것도 못 했다」 가 아니라 「고장 났다」 로 읽힌다.
 * 탄소는 도 전체를 합치면 t 이 되므로 「kg CO₂」 의 앞머리만 갈아 끼운다.
 */
export function impactFigure(def: ImpactDef, kwh: number): SiScale {
  const raw = kwh * def.perKwh;

  if (def.scale === 'carbon') {
    const scaled = scaleCarbon(raw);

    return { ...scaled, unit: `${scaled.unit} CO₂` };
  }

  // 두 해를 넘기면 날수보다 햇수가 빨리 읽힌다. 햇수도 여섯 자리가 되면 만·억으로 한 번 더 접는다
  if (def.scale === 'days' && raw >= 730) return scaleKoCount(raw / 365, '년');
  if (def.scale === 'hours' && raw >= 8_760) return scaleKoCount(raw / 8_760, '년');

  // 그루처럼 올릴 윗단위가 없는 것도 우리말 이름으로 접는다
  if (def.fractionDigits === 0) return scaleKoCount(raw, def.unit);

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
 * 자리마다 무슨 일이 일어나는가 (고등 전용).
 *
 * 한때 AI 진단 절차를 나란히 적었다. 학생이 배워야 할 것은 진단 절차가 아니라 발전 원리라
 * 그쪽을 걷어냈고(2026-08-24), 남은 것은 자리와 거기서 일어나는 일뿐이다. 그래서 진단 단계로
 * 묶여 있던 것을 **자리로** 다시 묶었다 — 그리는 쪽이 자리로 찾아 쓰기 때문이다.
 */
export interface EduStageContent {
  head: string;
  note: string;
  /** 설비 그림의 자리마다, 거기서 일어나는 일 */
  spots: Record<PlantSpot, string>;
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
  stage: EduStageContent;
}

export type EduContent = ElementaryContent | MiddleContent | HighContent;

/*
  고등 — 세 판 가운데 가장 많은 것을 보여 주는 판.

  한때 물리 용어와 계산식을 그대로 적었는데(PN 접합·광기전력 효과·공기질량·MPPT·바이패스 다이오드),
  고등학생이 걸음을 멈추고 읽기에는 어려워 읽히지 않았다. 그래서 다루는 개념은 그대로 두고
  말만 중학교 과학 수준으로 낮췄다 — 덜어낸 것은 지식이 아니라 전문 용어다 (2026-08-31 검토 의견).

  세 번째로 훑었다 (2026-09-04 지시). 이번에 걷어낸 것은 **읽는 사람이 이미 아는 것으로 바꿀 수
  있었던 말**이다 — 「고도」 를 해의 높이로, 「수직에 가깝게」 를 똑바로 내리쬔다로, 「직류·교류」 를
  흐르는 방향이 어떻게 다른지로, 「전자」 를 아주 작은 알갱이로 풀어 적었다. 개념은 그대로 넷이고
  줄 수도 그대로다.

  문체는 서술체, 지표 이름은 표준 용어 그대로다. 쉬워져야 할 것은 설명이지 이름이 아니다.
*/
export const HIGH_CONTENT: HighContent = {
  level: 'high',
  emphasis: 'normal',
  headline: {
    mainLabel: '실시간 출력',
    mainNote: (stats) =>
      `한 번에 만들 수 있는 최대치 ${capacityText(stats)} 가운데 지금 내고 있는 만큼이다`,
    statIds: ['today', 'total', 'powerTime', 'co2', 'irradiance', 'capacity'],
    // 기본 문구가 이미 서술체이자 표준 용어라 덮어쓸 것이 없다. 일사량은 `headlineFor` 가 맡는다.
  },
  /*
    두 마디를 한 문장씩으로 줄였다 (2026-09-07 지시 — 내용이 넘친다).

    설명이 두 문장씩이라 넉 줄이 되었고, 칸이 주는 높이보다 21px 이 길어 둘째 마디의 끝이
    잘렸다. 두 문장 가운데 앞은 「무슨 일이 일어나나」, 뒤는 「그래서 어떻게 되나」 였는데,
    둘을 한 문장으로 이으면 인과가 오히려 또렷해진다 — 잘라 낸 것은 뜻이 아니라 마침표다.

    판 이름 아래 한 줄도 걷었다. 「해의 높이가 시각마다 달라지고, 그에 따라 햇빛의 힘도
    달라진다」 는 아래 두 마디가 그대로 하는 말이라, 같은 이야기를 세 번 하고 있었다.
  */
  sunPath: {
    head: '해가 하루 동안 지나는 길',
    note: '해의 높이가 햇빛의 힘을 정한다',
    notes: [
      {
        id: 'angle',
        term: '해가 높이 뜰수록 많이 만든다',
        body: '해가 머리 위에 오면 햇빛이 지붕에 똑바로 내리쬐어, 같은 빛이 좁은 자리에 모인다.',
      },
      {
        id: 'airmass',
        term: '아침저녁 햇빛은 힘이 약하다',
        body: '해가 낮으면 햇빛이 공기를 더 길게 지나오며 먼지에 부딪혀 흩어진다.',
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
        term: '차트가 가장 높은 때가 해가 가장 높은 때다',
        body: '오늘 얼마나 만드는지는 설비가 좋고 나쁨이 아니라, 그 시각에 들어온 햇빛의 양이 정한다.',
      },
      {
        id: 'cloud',
        term: '둘이 함께 내려갔다면 날씨 탓이다',
        body: '햇빛 세기는 그대로인데 발전량만 내려갔다면 먼지·그늘·고장을 살펴봐야 한다.',
      },
    ],
  },
  impact: {
    head: '환산해 본 의미',
    /*
      한 줄로 줄였다 (2026-09-07 지시 — 나무를 키우려면).

      세 줄짜리 설명이 판 높이의 절반을 먹어 그림에 129px 밖에 남지 않았다. 「얼마나 되는 양인지
      익숙한 것으로 바꿔 보면」 은 판 이름(환산해 본 의미)이 이미 하는 말이라, 값과 대상만 남긴다.
      대상 이름의 받침에 따라 조사가 달라지지 않도록 "에서" 로 받는다.
    */
    note: (scopeLabel, stats) => `${scopeLabel}에서 그동안 만든 ${energyText(stats.totalKwh)}`,
    // 좁은 칸에서 두 줄이 되어 카드를 6px 밀어냈다 — 「날마다 늘어난다」 는 「쌓인」 에 이미 들어 있다
    caption: '설치한 뒤로 쌓인 값이다',
    /*
      한 장만 남긴다 (2026-09-04 회의).

      석 장을 늘어놓아도 셋 다 같은 말을 다른 단위로 되풀이할 뿐이다. 임팩트가 가장 큰 탄소 하나로
      모으고, 비운 자리는 기상 칸이 받는다 — 상황판에서 「오늘 왜 적게 만들었나」 에 답하는 것은
      환산이 아니라 날씨다.
    */
    itemIds: ['co2'],
    /*
      계산 근거 줄은 걷어냈다 (2026-08-31 검토 의견).
      「배출계수 0.4594kgCO₂/kWh 기준」 같은 줄은 눈높이를 중학교 수준으로 내리면서 남길 자리가
      아니고, 무엇을 어떻게 셈했는지는 카드마다 붙는 한 줄과 아래 캡션이 이미 말한다.
      비운 세 줄만큼 아래 계통 칸이 제 높이를 되찾기도 한다 — 글씨를 키운 뒤로는 그쪽이 잘렸다.
    */
    showBasis: false,
  },
  /*
    가운데 칸이 자리를 하나씩 당겨 보는 동안, 이쪽은 넷이 한 줄로 이어져 있다는 것을 보여 준다.
    제목을 「햇빛이 전기가 되기까지」 로 두었더니 가운데 칸과 같은 말이 한 화면에 두 번 나와,
    두 칸이 같은 것을 두 번 말하는 것처럼 보였다.
  */
  journey: {
    head: '전체 흐름 한눈에 보기',
    note: '지붕에서 교실까지, 네 단계가 한 줄로 이어진다',
  },
  stage: {
    head: '햇빛이 전기가 되기까지',
    note: '태양전지에서 학교까지, 전기가 만들어져 흘러가는 네 곳을 차례로 본다',
    spots: {
      cell:
        '지붕에 깔린 얇고 검푸른 판이 태양전지다. 햇빛이 닿으면 판 안에 있는 아주 작은 알갱이(전자)가 '
        + '힘을 얻어 한쪽으로 밀려 나가는데, 그것이 줄지어 흐르는 것이 곧 전기다. '
        + '전기가 실제로 만들어지는 자리가 여기다.',
      module:
        '태양전지 여러 장을 한 판으로 묶은 것이 모듈이고, 모듈을 한 줄로 이어 놓은 것이 스트링이다. '
        + '한 줄로 이어져 있어서 그중 한 장만 그늘이 져도 그 줄 전체가 함께 힘을 잃는다.',
      // 직류와 교류가 어떻게 다른지까지 풀면 이 자리만 세 문장이 된다. 하는 일 한 줄로 족하다.
      inverter: '지붕에서 만든 전기를 인버터가 교실 콘센트에서 쓸 수 있는 형태로 바꾼다.',
      grid:
        '바뀐 전기는 학교가 그대로 쓴다. 쓰는 곳에서 바로 만드니 멀리 보내며 잃는 전기가 없고, '
        + '그만큼 밖에서 사 오는 전기가 줄어든다.',
    },
  },
  facts: [
    '태양전지는 뜨거우면 오히려 힘이 떨어진다. 그래서 한여름보다 볕 좋은 봄·가을에 전기가 더 나온다.',
    '판에 먼지가 쌓이면 만드는 전기가 줄고, 비가 내려 씻기면 다시 돌아온다.',
    '한 줄로 이은 판 가운데 하나만 그늘이 져도 그 줄 전체가 함께 힘을 잃는다.',
    '지붕에 놓으면 따로 땅이 들지 않고, 여름에는 지붕에 그늘을 만들어 건물 온도도 낮춰 준다.',
    'kW 는 지금 이 순간의 힘, kWh 는 그 힘으로 일정 시간 동안 만든 전기의 양이다. 속도와 거리의 관계와 같다.',
    '1,000kW 는 1MW, 1,000MW 는 1GW 다. 여러 학교를 합쳐 보면 단위가 이렇게 올라간다.',
  ],
};

export const EDU_CONTENT: Record<EduLevel, EduContent> = {
  elementary: ELEMENTARY_CONTENT,
  middle: MIDDLE_CONTENT,
  high: HIGH_CONTENT,
};

export function getEduContent(level: EduLevel): EduContent {
  return EDU_CONTENT[level];
}

/** 지표 한 줄에 수준별 덮어쓰기를 얹어 낸다. */
export function statOf(id: StatId, copy?: StatCopy): StatDef {
  return copy ? { ...STAT_DEFS[id], ...copy } : STAT_DEFS[id];
}

/**
 * 일사량을 점수가 아니라 잰 값으로 읽는 방식.
 *
 * 점수는 단위를 모르는 눈높이를 위해 맑은 날 정오를 100 으로 놓고 환산한 값이다.
 */
const MEASURED_IRRADIANCE: StatCopy = {
  value: (stats) => stats.irradianceNow,
  unit: 'W/m²',
  fractionDigits: 0,
  note: () => '지붕 1m² 의 햇빛 세기',
};

/**
 * 요약 띠에 **보는 사람의 눈높이**를 얹는다 (2026-09-09 지시).
 *
 * 다른 것은 모두 대본이 정한다 — 어떤 칸이 어느 눈높이의 글을 읽을지는 시안 격자(`EDU_CELLS`)에
 * 적혀 있고, 고등 시안 c 는 중등 대본을 읽는다(2026-08-31 「고등이 너무 어렵다」).
 *
 * 단위만 그 규칙을 따르지 않는다. 대본이 무엇을 얼마나 쉽게 말할지를 정하는 것과 달리, 「W/m² 를
 * 읽을 수 있는가」 는 **글이 아니라 읽는 사람**에 달린 문제이기 때문이다. 대본에 매어 두었더니
 * 같은 고등학생이 시안 b 에서는 466 W/m² 를, 시안 c 에서는 47 점을 보게 되었다.
 *
 * 그래서 단위를 가르는 자리를 여기 하나로 두고, 눈높이가 고등이면 어느 대본을 읽든 잰 값을 보인다.
 */
export function headlineFor(headline: HeadlineContent, level: EduLevel): HeadlineContent {
  if (level !== 'high') return headline;

  return {
    ...headline,
    // 대본이 일사량에 붙여 둔 문구가 있어도 잰 값 쪽이 이긴다
    copy: { ...headline.copy, irradiance: { ...headline.copy?.irradiance, ...MEASURED_IRRADIANCE } },
  };
}

/** 환산 카드 한 장에 수준별 덮어쓰기를 얹어 낸다. */
export function impactOf(id: ImpactId, copy?: ImpactCopy): ImpactDef {
  return copy ? { ...IMPACT_DEFS[id], ...copy } : IMPACT_DEFS[id];
}
