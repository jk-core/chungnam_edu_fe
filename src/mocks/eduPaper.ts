import type { EduLevel } from '@/interface/edu';
import type { WeatherKind } from '@/interface/weather';
import type { EduStats } from '@/mocks/solarEdu';
import { WEATHER_META } from '@/mocks/weather';
import { CO2_PER_KWH, CO2_PER_TREE_YEAR } from '@/utils/eco';
import { clockOf, formatPercent, scaleCarbon, scaleSi } from '@/utils/format';

/**
 * 시안 E 「네 개의 질문」 의 대본과 셈 (SFR-005).
 *
 * 다른 시안이 지표를 칸에 늘어놓는 데 견줘, 이 판은 **묻고 답하는 네 장**으로 간다.
 * 그래서 대본도 지표 목록이 아니라 장 단위로 묶여 있다 — 장 하나가 질문 하나와
 * 그 답에 필요한 것들을 통째로 갖는다.
 *
 * 눈높이는 문구와 **읽을 것의 수**를 가른다. 어느 눈높이든 같은 네 질문에 같은 수치로 답하되,
 * 고등만 값을 재는 기준(일사강도·이용률·셈의 근거)까지 펴 본다 (SFR-005-04).
 */

// ── 장 ────────────────────────────────────────────────────
export type ChapterId = 'summary' | 'principle' | 'carbon' | 'factors';

/** 왼쪽 궤도에 박히는 순서. 화면이 좁아지면 이 순서대로 이어 읽는 긴 지면이 된다. */
export const CHAPTER_IDS: ChapterId[] = ['summary', 'principle', 'carbon', 'factors'];

/** 궤도 눈금에 적는 짧은 이름 — 질문 전문은 지면에서 크게 다시 나온다 */
export const CHAPTER_MARK: Record<ChapterId, string> = {
  summary: '오늘의 발전',
  principle: '전기가 되는 길',
  carbon: '줄인 탄소',
  factors: '많고 적은 까닭',
};

// ── 대본 조각 ─────────────────────────────────────────────
/** 장 머리 — 큰 질문 한 줄과 그 아래 받는 줄 */
interface ChapterHead {
  question: string;
  lead: string;
}

/** 1장에서 어느 눈높이나 읽어 내리는 값 */
export type BaseReadingId = 'output' | 'today' | 'capacity' | 'hours';

/** 고등에만 두 줄이 더 붙는다 — 값을 재는 기준까지 읽는 눈높이다 */
export type ReadingId = BaseReadingId | 'irradiance' | 'utilization';

/** 2장의 네 걸음 */
export type StepId = 'sun' | 'cell' | 'inverter' | 'school';

export const STEP_IDS: StepId[] = ['sun', 'cell', 'inverter', 'school'];

/** 3장에서 저감량을 바꿔 보는 잣대 */
export type ScaleId = 'tree' | 'car' | 'home';

export const SCALE_IDS: ScaleId[] = ['tree', 'car', 'home'];

/** 4장에서 발전량을 밀어 올리거나 끌어내리는 것 */
export type FactorId = 'sunlight' | 'sunHeight' | 'heat' | 'shade' | 'equipment';

export const FACTOR_IDS: FactorId[] = ['sunlight', 'sunHeight', 'heat', 'shade', 'equipment'];

export interface PaperScript {
  /** 지면 머리에 적는 한 줄 */
  banner: string;
  heads: Record<ChapterId, ChapterHead>;
  /** 1장 — 값마다 무슨 뜻인지 */
  readings: Record<BaseReadingId, string>;
  /** 2장 — 걸음마다 무슨 일이 일어나는지 */
  steps: Record<StepId, string>;
  /** 3장 — 잣대마다 그것이 무슨 뜻인지 */
  scales: Record<ScaleId, string>;
  /** 4장 — 요인마다 왜 늘거나 주는지 */
  factors: Record<FactorId, string>;
  /** 4장 맺음 한 줄 */
  closing: string;
}

// ── 눈높이별 대본 ─────────────────────────────────────────
const ELEMENTARY: PaperScript = {
  banner: '우리 학교 지붕이 오늘 만든 전기를 네 가지 질문으로 읽어 봅니다',
  heads: {
    summary: {
      question: '지금 우리 학교는 전기를 얼마나 만들고 있나요',
      lead: '지붕에 깔린 태양광 설비가 이 순간 만들고 있는 전기입니다',
    },
    principle: {
      question: '햇빛은 어떻게 전기가 되나요',
      lead: '햇빛이 지붕에 닿아 교실 콘센트에 이르기까지 네 걸음을 지납니다',
    },
    carbon: {
      question: '오늘 탄소를 얼마나 줄였나요',
      lead: '여기서 만든 만큼 화석연료로 만드는 전기가 줄어듭니다',
    },
    factors: {
      question: '전기가 많이 만들어지는 날은 언제인가요',
      lead: '발전량을 늘리는 것과 줄이는 것이 함께 작용합니다',
    },
  },
  readings: {
    output: '지금 이 순간 만들고 있는 전기의 세기입니다',
    today: '오늘 아침부터 지금까지 만든 전기를 모두 더한 양입니다',
    capacity: '우리 학교 설비가 한 번에 만들 수 있는 가장 큰 값입니다',
    hours: '오늘 만든 전기를 가장 센 힘으로만 만들었다면 걸렸을 시간입니다',
  },
  steps: {
    sun: '해가 높이 뜰수록 햇빛이 지붕에 똑바로 내리쬡니다. 같은 빛이 좁은 자리에 모이면 전기도 많아집니다.',
    cell: '지붕에 깔린 판을 태양전지라고 합니다. 햇빛이 닿는 동안 계속 전기가 만들어집니다.',
    inverter: '태양전지가 만든 전기는 교실에서 그대로 쓸 수 없습니다. 인버터가 쓸 수 있는 전기로 바꿔 줍니다.',
    school: '바뀐 전기는 학교가 바로 씁니다. 그만큼 밖에서 사 오는 전기가 줄어듭니다.',
  },
  scales: {
    tree: '줄인 탄소를 소나무 한 그루가 1년 동안 마시는 양으로 나눈 값입니다',
    car: '자동차가 이만큼 달릴 때 나오는 탄소와 같은 양입니다',
    home: '네 사람이 사는 집 한 채가 며칠 동안 쓸 수 있는 전기입니다',
  },
  factors: {
    sunlight: '구름이 해를 가리면 지붕에 닿는 햇빛이 줄어듭니다',
    sunHeight: '해가 높이 뜬 한낮에 햇빛이 가장 세게 내리쬡니다',
    heat: '판이 뜨거워지면 오히려 전기가 덜 만들어집니다',
    shade: '판 위에 먼지가 쌓이거나 그늘이 지면 그만큼 줄어듭니다',
    equipment: '설비가 고장 없이 잘 돌아가면 만들 수 있는 만큼 다 만듭니다',
  },
  closing: '그래서 같은 학교라도 날마다 만드는 전기가 다릅니다',
};

const MIDDLE: PaperScript = {
  banner: '우리 학교의 오늘 발전을 네 가지 질문으로 나누어 읽습니다',
  heads: {
    summary: {
      question: '지금 우리 학교는 얼마나 만들고 있나',
      lead: '지붕의 태양광 설비가 이 순간 내고 있는 값과, 오늘 쌓인 값입니다',
    },
    principle: {
      question: '햇빛은 어떤 과정을 거쳐 전기가 되나',
      lead: '햇빛이 지붕에 닿는 곳에서 교실 콘센트까지, 네 단계를 지납니다',
    },
    carbon: {
      question: '오늘 줄인 탄소는 얼마만큼인가',
      lead: '여기서 만든 만큼 화석연료 발전이 줄어, 그만큼 태우지 않아도 됩니다',
    },
    factors: {
      question: '발전량은 무엇이 늘리고 무엇이 줄이나',
      lead: '설비는 그대로인데 날마다 값이 달라지는 까닭입니다',
    },
  },
  readings: {
    output: '지금 이 순간의 발전 세기입니다. 햇빛이 세지면 곧바로 따라 오릅니다',
    today: '오늘 0시부터 지금까지 만든 전력량을 모두 더한 값입니다',
    capacity: '설비가 한 번에 낼 수 있는 최대치입니다. 실시간 출력은 이 값을 넘지 않습니다',
    hours: '오늘 만든 전력량을 설비용량으로 나눈 값입니다. 최대 세기로만 만들었다면 걸렸을 시간입니다',
  },
  steps: {
    sun: '해가 높을수록 햇빛이 지붕에 가깝게 수직으로 들어옵니다. 같은 빛이 좁은 면적에 모여 일사강도가 올라갑니다.',
    cell: '지붕에 깔린 판이 태양전지입니다. 햇빛을 받으면 전기가 흐르고, 빛이 닿는 동안 계속 만들어집니다.',
    inverter: '태양전지가 만든 전기는 한 방향으로만 흐르는 직류입니다. 교실 콘센트에 오는 것은 교류라서 인버터가 바꿔 줍니다.',
    school: '바뀐 전기는 학교가 그대로 씁니다. 쓰는 곳에서 바로 만드니 멀리 보내며 잃는 전기가 없습니다.',
  },
  scales: {
    tree: '소나무 한 그루가 1년 동안 흡수하는 탄소량으로 나눈 값입니다',
    car: '승용차가 이 거리를 달릴 때 나오는 탄소와 같은 양입니다',
    home: '4인 가구 한 집이 며칠 동안 쓸 수 있는 전력량입니다',
  },
  factors: {
    sunlight: '구름이 해를 가리면 지붕에 닿는 일사강도가 그만큼 떨어집니다',
    sunHeight: '해가 높이 뜬 시각일수록 같은 빛이 좁은 면적에 모입니다',
    heat: '판의 온도가 오르면 효율이 떨어집니다. 한여름보다 봄·가을에 발전량이 더 나오는 까닭입니다',
    shade: '판 위에 쌓인 먼지와 주변 그림자가 받는 빛을 가립니다',
    equipment: '인버터가 멈추거나 일부 스트링이 빠지면 그만큼 덜 만들어집니다',
  },
  closing: '설비용량이 같아도 이 다섯 가지가 겹쳐 날마다 다른 값이 나옵니다',
};

const HIGH: PaperScript = {
  banner: '오늘의 발전을 네 가지 질문으로 나누어 읽습니다',
  heads: {
    summary: {
      question: '지금 이 설비는 얼마나 만들고 있나',
      lead: '이 순간의 출력과 오늘 쌓인 전력량, 그리고 그 값을 재는 기준입니다',
    },
    principle: {
      question: '햇빛은 어떤 과정을 거쳐 전기가 되나',
      lead: '햇빛이 지붕에 닿는 곳에서 교실 콘센트까지, 네 단계를 지납니다',
    },
    carbon: {
      question: '오늘 줄인 탄소는 얼마만큼인가',
      lead: '여기서 만든 만큼 화석연료 발전이 줄어, 그만큼 태우지 않아도 됩니다',
    },
    factors: {
      question: '발전량은 무엇이 늘리고 무엇이 줄이나',
      lead: '설비는 그대로인데 날마다 값이 달라지는 까닭입니다',
    },
  },
  readings: {
    output: '지금 이 순간의 발전 출력입니다. 일사강도가 오르내리면 곧바로 따라 움직입니다',
    today: '오늘 0시부터 지금까지 쌓인 발전량입니다. 시간이 갈수록 늘기만 합니다',
    capacity: '설비가 한 번에 낼 수 있는 최대 출력입니다. 실시간 출력은 이 값을 넘지 않습니다',
    hours: '발전량을 설비용량으로 나눈 값입니다. 설비 크기가 다른 학교끼리 견줄 때 이 값을 씁니다',
  },
  steps: {
    sun: '해의 높이에 따라 지붕에 닿는 일사강도가 달라집니다. 해가 높을수록 같은 빛이 좁은 면적에 모여 값이 올라갑니다.',
    cell: '태양전지 하나하나를 이어 붙인 것이 모듈이고, 모듈을 줄지어 이은 것이 스트링입니다. 빛이 닿는 동안 전기가 흐릅니다.',
    inverter: '태양전지가 내는 것은 한 방향으로만 흐르는 직류입니다. 교실에서 쓰는 것은 교류라서 인버터가 바꿔 줍니다.',
    school: '바뀐 전기는 학교가 그대로 씁니다. 쓰는 곳에서 만드니 송전하며 잃는 몫이 없습니다.',
  },
  scales: {
    tree: '소나무 한 그루가 1년 동안 흡수하는 탄소량으로 나눈 값입니다',
    car: '승용차가 이 거리를 달릴 때 배출하는 탄소와 같은 양입니다',
    home: '4인 가구 한 집이 며칠 동안 쓸 수 있는 전력량입니다',
  },
  factors: {
    sunlight: '구름이 해를 가리면 지붕에 닿는 일사강도가 그만큼 떨어집니다',
    sunHeight: '해가 높이 뜬 시각일수록 같은 빛이 좁은 면적에 모여 일사강도가 오릅니다',
    heat: '모듈 온도가 오르면 효율이 떨어집니다. 한여름보다 봄·가을 발전량이 더 나오는 까닭입니다',
    shade: '표면에 쌓인 오염과 주변 그림자가 받는 빛을 가립니다',
    equipment: '인버터 정지나 스트링 탈락이 있으면 그만큼 덜 만들어집니다',
  },
  closing: '설비용량이 같아도 이 다섯 가지가 겹쳐 날마다 다른 값이 나옵니다',
};

export const PAPER_SCRIPT: Record<EduLevel, PaperScript> = {
  elementary: ELEMENTARY,
  middle: MIDDLE,
  high: HIGH,
};

/** 시안 이름표 — 눈높이마다 골격이 갈리지만 묻는 네 질문은 같다 */
export const PAPER_LABEL = '시안 E · 네 개의 질문';

// ── 1장 · 읽어 내리는 값 ──────────────────────────────────
/*
  수치는 서식을 입힌 글이 아니라 **숫자**로 넘긴다.
  화면에서 0부터 굴러 올라가려면 목표값이 수로 있어야 하고, 자릿수는 그리는 쪽이 정한다.
*/
export interface PaperReading {
  id: ReadingId;
  term: string;
  amount: number;
  fractionDigits: number;
  unit: string;
  note: string;
}

/**
 * 큰 수치 넷을 한 줄씩 읽어 내린다.
 * 자릿수가 커지면 단위를 올린다 — 도 전체를 합치면 kW 로는 칸을 넘긴다.
 */
export function paperReadings(stats: EduStats, script: PaperScript): PaperReading[] {
  const output = scaleSi(stats.outputKw, 'W', 2);
  const today = scaleSi(stats.todayKwh, 'Wh');
  const capacity = scaleSi(stats.capacityKw, 'W');

  return [
    {
      id: 'output',
      term: '실시간 출력',
      amount: output.amount,
      fractionDigits: output.fractionDigits,
      unit: output.unit,
      note: script.readings.output,
    },
    {
      id: 'today',
      term: '금일 발전량',
      amount: today.amount,
      fractionDigits: today.fractionDigits,
      unit: today.unit,
      note: script.readings.today,
    },
    {
      id: 'capacity',
      term: '설비용량',
      amount: capacity.amount,
      fractionDigits: capacity.fractionDigits,
      unit: capacity.unit,
      note: script.readings.capacity,
    },
    {
      id: 'hours',
      term: '발전시간',
      amount: stats.equivalentHours,
      fractionDigits: 1,
      unit: '시간',
      note: script.readings.hours,
    },
  ];
}

/**
 * 고등에만 덧붙는 두 줄 (SFR-005-04).
 *
 * 같은 네 질문이라도 고등은 값을 재는 **기준**까지 읽는 눈높이다. 일사강도는 발전량이
 * 왜 그만큼인지를 설명하는 원인이고, 이용률은 설비 크기가 다른 학교끼리 견주는 잣대다.
 * 초·중등에 두면 읽을 것이 많아지기만 하므로 여기서만 꺼낸다.
 */
export function paperExtraReadings(stats: EduStats): PaperReading[] {
  return [
    {
      id: 'irradiance',
      term: '일사강도',
      amount: stats.irradianceNow,
      fractionDigits: 0,
      unit: 'W/㎡',
      note: '지금 이 순간 지붕 1㎡ 에 닿고 있는 햇빛의 세기입니다. 출력은 이 값을 따라 움직입니다',
    },
    {
      id: 'utilization',
      term: '이용률',
      amount: stats.capacityFactor * 100,
      fractionDigits: 1,
      unit: '%',
      note: '하루 발전량을 설비용량과 24시간으로 나눈 값입니다. 설비 크기가 다른 학교끼리 견줄 때 씁니다',
    },
  ];
}

// ── 2장 · 네 걸음 ─────────────────────────────────────────
export interface PaperStep {
  id: StepId;
  term: string;
  /** 이 걸음에서 지금 재고 있는 값 */
  gaugeTerm: string;
  amount: number;
  fractionDigits: number;
  unit: string;
  body: string;
}

const STEP_TERM: Record<StepId, string> = {
  sun: '햇빛',
  cell: '태양전지',
  inverter: '인버터',
  school: '학교',
};

/** 걸음마다 지금 값을 하나씩 실어, 그림이 오늘의 값과 붙어 읽히게 한다 */
export function paperSteps(stats: EduStats, script: PaperScript): PaperStep[] {
  const output = scaleSi(stats.outputKw, 'W', 2);
  const today = scaleSi(stats.todayKwh, 'Wh');

  const gauges: Record<StepId, { term: string; amount: number; fractionDigits: number; unit: string }> = {
    sun: { term: '일사강도', amount: stats.irradianceNow, fractionDigits: 0, unit: ' W/㎡' },
    cell: { term: '설비 대비', amount: stats.loadRatio * 100, fractionDigits: 0, unit: '%' },
    inverter: { term: '실시간 출력', amount: output.amount, fractionDigits: output.fractionDigits, unit: output.unit },
    school: { term: '금일 발전량', amount: today.amount, fractionDigits: today.fractionDigits, unit: today.unit },
  };

  return STEP_IDS.map((id) => ({
    id,
    term: STEP_TERM[id],
    gaugeTerm: gauges[id].term,
    amount: gauges[id].amount,
    fractionDigits: gauges[id].fractionDigits,
    unit: gauges[id].unit,
    body: script.steps[id],
  }));
}

// ── 3장 · 저감량을 바꿔 보는 잣대 ─────────────────────────
/** 승용차 1km 주행에서 나오는 탄소(kg). 환경부 온실가스 배출 계수 기준. */
const CO2_PER_CAR_KM = 0.106;

/** 4인 가구가 하루에 쓰는 전력량(kWh). 월 350kWh 기준. */
const HOUSEHOLD_DAY_KWH = 350 / 30;

export interface PaperScale {
  id: ScaleId;
  term: string;
  amount: number;
  unit: string;
  fractionDigits: number;
  note: string;
  /** 무엇으로 나눈 값인지. 고등에서만 펴 보인다 */
  basis: string;
  /** 그림 하나가 맡는 몫 */
  perGlyph: number;
  /** 늘어놓을 그림 수 */
  glyphs: number;
}

/** 탄소 저감량이 어떻게 나온 값인지. 고등에서만 펴 보인다 */
export const CARBON_BASIS = `전기 1kWh 를 화석연료로 만들 때 나오는 ${CO2_PER_KWH}kg 기준`;

/** 오늘 줄인 탄소(kg) */
export function paperCarbonKg(stats: EduStats): number {
  return stats.dayKwh * CO2_PER_KWH;
}

/** 지면 머리에 크게 적을 저감량 — t 으로 올라가면 단위를 바꿔 단다 */
export function paperCarbonFigure(stats: EduStats) {
  const scaled = scaleCarbon(paperCarbonKg(stats));

  return { ...scaled, unit: `${scaled.unit} CO₂` };
}

/**
 * 그림 하나가 맡을 몫을 1·2·5 자리에서 고른다.
 *
 * 반복해 늘어놓는 그림은 개수를 세는 것이 아니라 **덩어리 크기**를 보이는 장치라,
 * 그림 하나가 「430그루」 처럼 어중간한 값을 맡으면 읽는 사람이 셈을 해야 한다.
 * 여덟 개 안팎이 되도록 잡되, 몫 자체는 딱 떨어지는 수로 내린다.
 */
function niceShare(amount: number): number {
  const rough = Math.max(amount / 8, 1);
  const decade = 10 ** Math.floor(Math.log10(rough));
  const scaled = rough / decade;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;

  return step * decade;
}

/** 그림은 열두 개를 넘기지 않는다 — 그보다 많으면 세는 눈이 지친다 */
const MAX_GLYPHS = 12;

function toScale(
  id: ScaleId,
  term: string,
  amount: number,
  unit: string,
  fractionDigits: number,
  note: string,
  basis: string,
): PaperScale {
  const perGlyph = niceShare(amount);

  return {
    id,
    term,
    amount,
    unit,
    fractionDigits,
    note,
    basis,
    perGlyph,
    glyphs: Math.max(1, Math.min(MAX_GLYPHS, Math.round(amount / perGlyph))),
  };
}

export function paperScales(stats: EduStats, script: PaperScript): PaperScale[] {
  const carbonKg = paperCarbonKg(stats);

  return [
    toScale(
      'tree',
      '소나무',
      carbonKg / CO2_PER_TREE_YEAR,
      '그루',
      0,
      script.scales.tree,
      `소나무 한 그루가 1년에 흡수하는 ${CO2_PER_TREE_YEAR}kg 기준`,
    ),
    toScale(
      'car',
      '승용차 주행',
      carbonKg / CO2_PER_CAR_KM,
      'km',
      0,
      script.scales.car,
      `승용차 1km 주행에서 나오는 ${CO2_PER_CAR_KM}kg 기준`,
    ),
    toScale(
      'home',
      '4인 가구 사용',
      stats.dayKwh / HOUSEHOLD_DAY_KWH,
      '일',
      1,
      script.scales.home,
      `4인 가구가 하루에 쓰는 ${HOUSEHOLD_DAY_KWH.toFixed(1)}kWh 기준`,
    ),
  ];
}

// ── 4장 · 늘리는 것과 줄이는 것 ───────────────────────────
export interface PaperFactor {
  id: FactorId;
  term: string;
  /** 발전량을 얼마나 밀어 올리거나 끌어내렸는지 (-1 ~ 1) */
  delta: number;
  /** 오늘 이 요인이 어땠는지 — 값 하나로 짚는다 */
  reading: string;
  note: string;
}

const FACTOR_TERM: Record<FactorId, string> = {
  sunlight: '햇빛의 세기',
  sunHeight: '해의 높이',
  heat: '판의 온도',
  shade: '그늘과 먼지',
  equipment: '설비 상태',
};

/** 늘 조금씩 깎아 먹는 몫. 청소 주기와 주변 지형에 따라 달라지지만 목업에서는 고정한다. */
const SHADE_LOSS = -0.05;

function clamp(value: number, limit: number): number {
  return Math.max(-limit, Math.min(limit, value));
}

/**
 * 오늘 발전량을 밀어 올린 것과 끌어내린 것 (목업).
 *
 * 실제로는 발전 예측 모델이 요인별 기여를 내지만, 여기서는 화면에서 읽히는 값들로만 셈한다 —
 * 날씨는 일사 감쇄 계수에서, 해의 높이는 지금 시각에서, 설비 상태는 기대발전량 대비에서 온다.
 * 값이 어디서 왔는지 보이지 않으면 교육 자료로 쓸 수 없기 때문이다.
 */
export function paperFactors(
  stats: EduStats,
  weather: WeatherKind,
  month: number,
  script: PaperScript,
): PaperFactor[] {
  const weatherMeta = WEATHER_META[weather];

  // 흐린 날을 기준(0.8)으로 삼아, 그보다 맑으면 밀어 올리고 흐리면 끌어내린 것으로 읽는다.
  const sunlight = weatherMeta.factor - 0.8;

  // 정오에서 멀어질수록 해가 낮다. 아침저녁은 빛이 비스듬히 들어와 같은 빛이 넓게 퍼진다.
  const noonness = Math.max(0, 1 - Math.abs(stats.nowHour - 12.5) / 6.5);
  const sunHeight = noonness * 0.28 - 0.08;

  // 한여름에는 판이 뜨거워져 효율이 떨어지고, 봄·가을에는 오히려 조금 낫다.
  const isSummer = month >= 5 && month <= 7;
  const isWinter = month === 11 || month === 0 || month === 1;
  const heat = isSummer ? -0.12 : isWinter ? 0.05 : 0.03;

  // 기대발전량 대비 실제. 설비가 제 몫을 하고 있는지가 여기에 드러난다.
  const equipment = stats.expectedKwh > 0 ? clamp(stats.dayKwh / stats.expectedKwh - 1, 0.15) : 0;

  const deltas: Record<FactorId, number> = {
    sunlight,
    sunHeight,
    heat,
    shade: SHADE_LOSS,
    equipment,
  };

  const readings: Record<FactorId, string> = {
    sunlight: `${weatherMeta.label} · 일사강도 ${Math.round(stats.irradianceNow)} W/㎡`,
    sunHeight: `${clockOf(stats.nowHour)} 기준`,
    heat: isSummer ? '여름 · 판이 달아오르는 철' : isWinter ? '겨울 · 판이 차가운 철' : '봄·가을 · 판이 알맞은 철',
    shade: '청소 주기와 주변 그림자 기준',
    equipment: `기대발전량 대비 ${formatPercent(stats.expectedKwh > 0 ? stats.dayKwh / stats.expectedKwh : 1, 0)}`,
  };

  return FACTOR_IDS.map((id) => ({
    id,
    term: FACTOR_TERM[id],
    delta: deltas[id],
    reading: readings[id],
    note: script.factors[id],
  })).sort((a, b) => b.delta - a.delta);
}
