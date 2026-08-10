import { CO2_PER_KWH, CO2_PER_TREE_YEAR, kwhToHouseholdDays } from '@/utils/eco';
import { formatNumber, formatPercent } from '@/utils/format';
import type { EduLevel } from '@/interface/edu';
import type { School, SchoolLevel } from '@/interface/energy';
import type { EduStats } from './solarEdu';

/*
  교육용 대시보드의 수준별 콘텐츠 (SFR-005-02/03/04).

  화면은 한 벌이고 여기 담긴 문구·지표 선택만 갈아 끼운다. 값을 만드는 함수(`value`, `note`)는
  데이터로 뺄 수 없어 아래 레지스트리에 두고, 수준 테이블은 "무엇을 몇 개 어떤 순서로 보일지" 와
  "문구를 무엇으로 덮어쓸지" 만 담는다. 그래야 학교를 바꾸면 수치만, 수준을 바꾸면 문구만 갈린다.
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

/** 맑은 날 정오의 일사강도(W/m²). 햇빛 세기를 100점 만점으로 환산하는 기준이다. */
const FULL_SUN_WM2 = 1000;

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

// ── 수준별 콘텐츠 ──────────────────────────────────────────

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

export interface EduContent {
  /** 멀리서 보는 나이일수록 글씨를 키운다 (SFR-005-04) */
  emphasis: 'normal' | 'large';
  headline: {
    mainLabel: string;
    mainNote: (stats: EduStats) => string;
    /** 보일 지표와 순서 — 개수가 곧 수준 차이다 */
    statIds: StatId[];
    copy?: Partial<Record<StatId, StatCopy>>;
  };
  sunPath: {
    head: string;
    note: string;
    notes: EduNote[];
  };
  day: {
    /** 곡선을 읽을 수 있는 나이인지 — 초등은 그림 카드로 바꾼다 */
    view: 'chart' | 'story';
    head: string;
    note: (stats: EduStats) => string;
    /** 곡선을 읽는 법. `view: 'story'` 에서는 쓰지 않는다 */
    notes: EduNote[];
    /** 햇빛 세기 점선을 함께 그릴지 */
    showIrradiance: boolean;
  };
  impact: {
    head: string;
    note: (scopeLabel: string, stats: EduStats) => string;
    caption: string;
    itemIds: ImpactId[];
    copy?: Partial<Record<ImpactId, ImpactCopy>>;
    /** 계산 근거 한 줄을 카드에 남길지 */
    showBasis: boolean;
  };
  journey: {
    head: string;
    note: string;
    topics: EduTopic[];
    /** 계통도 아래에 붙는 한 줄짜리 원리 (초등 판) — 글 대신 단계로 끊어 읽힌다 */
    steps?: { id: string; emoji: string; term: string; body: string }[];
  };
  /** 화면 아래를 도는 "알고 계셨나요" 문구 */
  facts: string[];
}

/*
  고등 — 지금까지 쓰던 판.
  비유 대신 물리적 원리와 정량 지표를 쓰고, 단위·계수·계산식을 감추지 않는다.
*/
const HIGH: EduContent = {
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
    view: 'chart',
    head: '그래서 오늘 이만큼 만들었어요',
    note: (stats) => `하루 모두 ${formatNumber(stats.dayKwh)}kWh · 색이 칠해진 넓이가 만든 양이에요`,
    showIrradiance: true,
    notes: [
      {
        id: 'shape',
        term: '곡선은 해가 지나간 길을 닮았어요',
        body:
          '봉우리가 솟은 자리가 해가 가장 높이 뜬 시각이에요. 위 그림에서 해가 오르내리는 모양이 '
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
    itemIds: ['co2', 'tree', 'household', 'led'],
    showBasis: true,
  },
  journey: {
    head: '햇빛이 전기가 되기까지',
    note: '지붕에서 교실까지 네 단계로 이어져요',
    topics: [
      {
        id: 'meaning',
        title: '왜 학교 지붕일까요',
        body:
          '넓고 비어 있는 지붕을 그대로 쓰니 따로 땅을 마련하지 않아도 돼요. 쓰는 곳에서 바로 만드니 멀리 보내며 잃는 전기도 없고요. '
          + '무엇보다 학생들이 매일 지나다니며 발전 설비를 직접 볼 수 있어요.',
      },
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
          + '왼쪽의 나무 그루 수는 그 양을 소나무가 1년 동안 마시는 양으로 바꿔 본 거예요.',
      },
    ],
  },
  facts: [
    '태양전지는 뜨거울수록 효율이 떨어져요. 한여름보다 볕 좋은 봄가을에 더 잘 만드는 까닭이에요.',
    '판에 쌓인 먼지는 발전량을 몇 %씩 갉아먹어요. 비가 한 번 내리면 그만큼 회복돼요.',
    '직렬로 이은 판 하나에 그늘이 지면 그 줄 전체가 함께 힘을 잃어요.',
    '요즘 판에는 바이패스 다이오드가 들어 있어, 그늘진 칸을 건너뛰고 전기를 흘려 보내요.',
    'kW 는 지금 이 순간의 힘, kWh 는 그 힘으로 쌓은 양이에요. 속도와 거리의 관계와 같아요.',
  ],
};

/*
  중등 — 용어를 쓰되 한 줄 풀이를 붙인다.
  곡선은 그대로 두고 읽는 법을 한 덩이로 줄여, 그래프를 처음 다루는 나이에 맞춘다.
*/
const MIDDLE: EduContent = {
  emphasis: 'normal',
  headline: {
    mainLabel: '지금 만들고 있는 전기',
    mainNote: (stats) =>
      `가장 셀 때(${formatNumber(stats.capacityKw)}kW)의 ${formatPercent(stats.loadRatio)}만큼 만들고 있어요`,
    statIds: ['today', 'irradiance', 'insolation'],
    copy: {
      insolation: {
        label: '해를 모은 시간',
        note: () => '가장 셀 때로만 돌렸다면 이만큼 걸렸을 거예요',
      },
    },
  },
  sunPath: {
    head: '해는 하루 동안 이렇게 지나가요',
    note: '햇빛이 들어오는 각도가 시각마다 달라져요',
    notes: [
      {
        id: 'angle',
        term: '해가 높이 뜰수록 많이 만들어요',
        body:
          '해가 높이 뜨면 햇빛이 판에 거의 똑바로 내리쬐요. 같은 양의 햇빛이 좁은 자리에 모이니 '
          + '판 1m² 가 받는 힘이 세져요. 그래서 정오 무렵에 가장 많이 만들어요.',
      },
      {
        id: 'airmass',
        term: '아침·저녁엔 공기층을 길게 지나요',
        body:
          '해가 낮게 뜨면 햇빛이 지나야 할 공기가 두꺼워져요. 그 사이에 먼지와 부딪혀 흩어지니 '
          + '판에 닿을 때는 이미 힘이 약해져 있어요.',
      },
    ],
  },
  day: {
    view: 'chart',
    head: '그래서 오늘 이만큼 만들었어요',
    note: (stats) => `하루 모두 ${formatNumber(stats.dayKwh)}kWh · 색칠된 넓이가 오늘 만든 양이에요`,
    showIrradiance: true,
    notes: [
      {
        id: 'shape',
        term: '곡선 모양은 해가 지나간 길과 같아요',
        body:
          '봉우리가 솟은 자리가 해가 가장 높이 뜬 시각이에요. 위 그림에서 해가 오르내린 모양이 '
          + '그대로 곡선이 되죠. 전기의 양을 정하는 건 설비가 아니라 햇빛이에요.',
      },
      {
        id: 'cloud',
        term: '두 선이 함께 내려가면 구름 탓이에요',
        body:
          '움푹 팬 자리는 대개 구름이 지나간 자리예요. 햇빛 선은 그대로인데 발전량만 떨어졌다면 '
          + '먼지나 그늘, 고장을 살펴봐야 해요.',
      },
    ],
  },
  impact: {
    head: '숫자로 보는 의미',
    note: (scopeLabel, stats) =>
      `${scopeLabel}에서 오늘 만든 ${formatNumber(stats.dayKwh)}kWh를 다른 것으로 바꿔 보면 이래요`,
    caption: '해를 많이 모은 날일수록 나무가 더 자라요',
    itemIds: ['co2', 'tree', 'household', 'led'],
    copy: {
      co2: { label: '줄인 온실가스' },
    },
    showBasis: true,
  },
  journey: {
    head: '햇빛이 전기가 되기까지',
    note: '지붕에서 교실까지 네 단계로 이어져요',
    topics: [
      {
        id: 'meaning',
        title: '왜 학교 지붕일까요',
        body:
          '넓고 비어 있는 지붕을 그대로 쓰니 따로 땅을 마련하지 않아도 돼요. '
          + '쓰는 곳에서 바로 만들어 멀리 보내며 잃는 전기도 없고요.',
      },
      {
        id: 'principle',
        title: '햇빛이 전기가 되는 원리',
        body:
          '햇빛 알갱이가 태양전지에 부딪히면 붙잡혀 있던 전자가 떨어져 나와요. 태양전지는 그 전자를 '
          + '한 방향으로만 흐르게 만들어 전기를 얻어요. 이 전기를 인버터가 교실에서 쓰는 형태로 바꿔 줘요.',
      },
      {
        id: 'effect',
        title: '무엇이 달라질까요',
        body:
          '여기서 만든 만큼 화력발전이 줄어요. 태우지 않은 연료가 곧 줄어든 온실가스이고, '
          + '왼쪽 나무 그루 수는 그 양을 나무가 마시는 양으로 바꿔 본 거예요.',
      },
    ],
  },
  facts: [
    '태양전지는 뜨거우면 오히려 힘이 빠져요. 한여름보다 볕 좋은 봄가을에 더 잘 만들어요.',
    '판에 먼지가 쌓이면 만드는 양이 줄어요. 비가 한 번 내리면 그만큼 돌아와요.',
    '줄지어 이은 판 하나에 그늘이 지면 그 줄 전체가 함께 힘을 잃어요.',
    '흐린 날에도 전기는 만들어져요. 다만 맑은 날의 몇 분의 일이에요.',
    'kW 는 지금의 힘, kWh 는 그 힘으로 쌓은 양이에요. 속도와 거리의 관계와 같아요.',
  ],
};

/*
  초등 — 짧은 문장과 비유로 간다.
  단위를 앞세우지 않고, 하루 발전은 곡선 대신 시간대별 해 그림으로 바꾼다.
*/
const ELEMENTARY: EduContent = {
  emphasis: 'large',
  headline: {
    mainLabel: '지금 만들고 있는 전기',
    mainNote: () => '가장 셀 때랑 견주면 지금 이만큼 만들고 있어요',
    statIds: ['today', 'irradiance'],
    copy: {
      today: {
        label: '오늘 만든 전기',
        note: (stats) => `집 ${formatNumber(kwhToHouseholdDays(stats.todayKwh))}곳이 하루 쓸 만큼이에요`,
      },
      irradiance: {
        label: '지금 햇빛 세기',
        note: () => '해가 가장 좋은 낮이 100점이에요',
      },
    },
  },
  sunPath: {
    head: '해가 지나가는 길이에요',
    note: '해는 아침에 떠서 낮에 가장 높이 올라요',
    notes: [
      {
        id: 'angle',
        term: '해가 높이 뜰수록 많이 만들어요',
        body:
          '해가 머리 위에 오면 햇빛이 판에 똑바로 쏟아져요. 그래서 낮에 전기를 가장 많이 만들어요. '
          + '아침과 저녁에는 햇빛이 비스듬히 들어와서 힘이 약해요.',
      },
    ],
  },
  day: {
    view: 'story',
    head: '오늘 하루 이만큼 만들었어요',
    note: (stats) => `모두 더하면 ${formatNumber(stats.dayKwh)}kWh 예요`,
    showIrradiance: false,
    notes: [],
  },
  impact: {
    head: '이만큼이면 무엇을 할 수 있을까요',
    note: (scopeLabel) => `${scopeLabel}에서 오늘 만든 전기를 다른 것으로 바꿔 봤어요`,
    caption: '해를 많이 본 날일수록 나무가 쑥쑥 자라요',
    itemIds: ['tree', 'household', 'led'],
    copy: {
      tree: { label: '나무 심은 만큼' },
      household: { label: '한 집이 쓰는 날' },
      led: { label: '교실 불 켜는 시간' },
    },
    showBasis: false,
  },
  journey: {
    head: '햇빛이 전기가 되기까지',
    note: '지붕에서 교실까지 이렇게 와요',
    // 원리를 글로 풀면 길어져 읽지 않는다. 네 단계로 끊어 한 줄씩만 남긴다 (SFR-005-02).
    steps: [
      { id: 'sun', emoji: '☀️', term: '햇빛이 닿아요', body: '지붕 위 판에 햇빛이 내리쬐요.' },
      { id: 'panel', emoji: '🔋', term: '전기가 생겨요', body: '햇빛이 판 속 알갱이를 밀어내면 전기가 흘러요.' },
      { id: 'inverter', emoji: '🔄', term: '쓸 수 있게 바꿔요', body: '인버터가 교실에서 쓰는 전기로 바꿔 줘요.' },
      { id: 'school', emoji: '🏫', term: '교실로 가요', body: '불을 켜고 선풍기를 돌려요. 남으면 밖으로 보내요.' },
    ],
    topics: [
      {
        id: 'meaning',
        title: '왜 학교 지붕일까요',
        body: '지붕은 넓고 비어 있어요. 그 자리에 판을 깔면 따로 땅이 없어도 전기를 만들 수 있어요.',
      },
      {
        id: 'effect',
        title: '무엇이 좋아질까요',
        body: '여기서 만든 전기만큼 발전소가 덜 돌아가요. 왼쪽 나무는 공기가 그만큼 깨끗해졌다는 뜻이에요.',
      },
    ],
  },
  facts: [
    '태양전지는 뜨거우면 오히려 힘이 빠져요. 여름보다 봄가을에 더 잘 만들어요.',
    '판에 먼지가 쌓이면 전기가 줄어요. 그래서 가끔 닦아 줘요.',
    '흐린 날에도 전기는 만들어져요. 맑은 날보다 조금 만들 뿐이에요.',
  ],
};

export const EDU_CONTENT: Record<EduLevel, EduContent> = {
  elementary: ELEMENTARY,
  middle: MIDDLE,
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
