import type { EduStats } from '@/mocks/solarEdu';
import { CO2_PER_KWH, CO2_PER_TREE_YEAR } from '@/utils/eco';
import { scaleCarbon, scaleCount, scaleKoCount, scaleSi } from '@/utils/format';
import type { EduLevel } from '@/interface/edu';
import { AIRCON_WATT } from './eduElementary';

/**
 * 「세 개의 질문」 의 대본과 셈 (SFR-005).
 *
 * 다른 시안이 지표를 칸에 늘어놓는 데 견줘, 이 판은 **묻고 답하는 세 장**으로 간다.
 * 그래서 대본도 지표 목록이 아니라 장 단위로 묶여 있다 — 장 하나가 질문 하나와
 * 그 답에 필요한 것들을 통째로 갖는다.
 *
 * 눈높이는 문구와 **읽을 것의 수**를 가른다. 어느 눈높이든 같은 세 질문에 같은 수치로 답하되,
 * 고등만 값을 재는 기준(일사량·이용률·셈의 근거)까지 펴 본다 (SFR-005-04).
 */

// ── 장 ────────────────────────────────────────────────────
export type ChapterId = 'principle' | 'summary' | 'carbon';

/**
 * 왼쪽 궤도에 박히는 순서. 화면이 좁아지면 이 순서대로 이어 읽는 긴 지면이 된다.
 *
 * 원리를 앞에 둔다 — 「지금 얼마나 만들고 있나」 부터 열면 값을 먼저 보여 주고 그것이 어디서
 * 왔는지를 나중에 말하게 된다. 걸어 두고 지나가며 보는 화면이라 첫 장이 곧 화면의 얼굴이고,
 * 교육용 화면의 얼굴은 값이 아니라 원리다 (2026-09-04 지시).
 */
export const CHAPTER_IDS: ChapterId[] = ['principle', 'summary', 'carbon'];

/** 궤도 눈금에 적는 짧은 이름 — 질문 전문은 지면에서 크게 다시 나온다 */
export const CHAPTER_MARK: Record<ChapterId, string> = {
  principle: '전기가 되는 길',
  summary: '오늘의 발전',
  carbon: '줄인 탄소',
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
export type ScaleId = 'tree' | 'aircon' | 'home';

export const SCALE_IDS: ScaleId[] = ['tree', 'aircon', 'home'];

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
}

// ── 눈높이별 대본 ─────────────────────────────────────────
const ELEMENTARY: PaperScript = {
  banner: '우리 학교 지붕이 오늘 만든 전기를 세 가지 질문으로 읽어 봅니다',
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
    aircon: '에어컨 한 대를 이만큼 오래 켤 수 있는 전기입니다',
    home: '네 사람이 사는 집 한 채가 며칠 동안 쓸 수 있는 전기입니다',
  },
};

const MIDDLE: PaperScript = {
  banner: '우리 학교의 오늘 발전을 세 가지 질문으로 나누어 읽습니다',
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
  },
  readings: {
    output: '지금 이 순간의 발전 세기입니다. 햇빛이 세지면 곧바로 따라 오릅니다',
    today: '오늘 0시부터 지금까지 만든 전력량을 모두 더한 값입니다',
    capacity: '설비가 한 번에 낼 수 있는 최대치입니다. 실시간 출력은 이 값을 넘지 않습니다',
    hours: '발전량을 설비용량으로 나눈 값입니다',
  },
  steps: {
    sun: '해가 높을수록 햇빛이 지붕에 똑바로 들어와 일사량이 올라갑니다.',
    cell: '지붕에 깔린 태양전지가 햇빛을 받아 전기를 만듭니다.',
    inverter: '인버터가 교실에서 쓸 수 있는 전기로 바꿔 줍니다.',
    school: '바뀐 전기는 학교가 그대로 씁니다.',
  },
  scales: {
    tree: '소나무 한 그루가 1년 동안 흡수하는 탄소량으로 나눈 값입니다',
    aircon: '에어컨 한 대를 이만큼 오래 켤 수 있는 전력량입니다',
    home: '4인 가구 한 집이 며칠 동안 쓸 수 있는 전력량입니다',
  },
};

const HIGH: PaperScript = {
  banner: '오늘의 발전을 세 가지 질문으로 나누어 읽습니다',
  heads: {
    summary: {
      question: '지금 이 설비는 얼마나 만들고 있나',
      lead: '이 순간의 출력과 오늘 쌓인 전력량, 그리고 그 값을 재는 기준입니다',
    },
    principle: {
      question: '햇빛은 어떤 과정을 거쳐 전기가 되나',
      lead: '햇빛이 지붕에 닿는 곳에서 교실 콘센트까지 네 단계를 지납니다. 단계마다 지금 재고 있는 값을 함께 봅니다',
    },
    carbon: {
      question: '오늘 줄인 탄소는 얼마만큼인가',
      lead: '여기서 만든 만큼 화석연료 발전이 줄어듭니다. 그 몫을 탄소량으로 환산한 값입니다',
    },
  },
  readings: {
    output: '지금 이 순간 내고 있는 출력입니다. 지붕에 닿는 일사량에 거의 비례해 오르내립니다',
    today: '오늘 0시부터 지금까지 쌓인 발전량입니다. 출력을 시간에 걸쳐 누적한 값이라 줄지 않고 늘기만 합니다',
    capacity: '설비가 한 번에 낼 수 있는 최대 출력입니다. 기준 조건에서 잰 값이라 실시간 출력은 이 값을 넘지 않습니다',
    hours: '발전량을 설비용량으로 나눈 값입니다. 최대 출력으로만 돌았다면 걸렸을 시간이라, 크기가 다른 설비끼리 견줄 때 씁니다',
  },
  steps: {
    sun: '해의 높이에 따라 지붕에 닿는 일사량이 달라집니다. 해가 높을수록 같은 빛이 좁은 면적에 모여 값이 올라갑니다.',
    cell: '태양전지 하나하나를 이어 붙인 것이 모듈이고, 모듈을 줄지어 이은 것이 스트링입니다. 빛이 닿는 동안 전기가 흐릅니다.',
    inverter: '태양전지가 내는 것은 한 방향으로만 흐르는 직류입니다. 교실에서 쓰는 것은 교류라서 인버터가 바꿔 줍니다.',
    school: '바뀐 전기는 학교가 그대로 씁니다. 쓰는 곳에서 만드니 송전하며 잃는 몫이 없습니다.',
  },
  /*
    잣대의 설명이 중등과 갈린다.

    고등에는 무엇으로 나눈 값인지가 `basis` 줄로 따로 붙는다. 여기서 그 나눗셈을 한 번 더 적으면
    같은 말이 두 줄이 되므로, 이쪽은 **그 수가 무슨 뜻인지**만 말한다.
  */
  scales: {
    tree: '같은 양의 탄소를 나무로 감당하려면 몇 그루가 필요한지를 뜻합니다',
    aircon: '같은 전력량으로 에어컨 한 대를 가동할 수 있는 시간입니다',
    home: '같은 전력량으로 4인 가구 한 집이 지낼 수 있는 날수입니다',
  },
};

export const PAPER_SCRIPT: Record<EduLevel, PaperScript> = {
  elementary: ELEMENTARY,
  middle: MIDDLE,
  high: HIGH,
};

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
 * 같은 네 질문이라도 고등은 값을 재는 **기준**까지 읽는 눈높이다. 일사량은 발전량이
 * 왜 그만큼인지를 설명하는 원인이고, 이용률은 설비 크기가 다른 학교끼리 견주는 잣대다.
 * 초·중등에 두면 읽을 것이 많아지기만 하므로 여기서만 꺼낸다.
 */
export function paperExtraReadings(stats: EduStats): PaperReading[] {
  return [
    {
      id: 'irradiance',
      term: '일사량',
      amount: stats.irradianceNow,
      fractionDigits: 0,
      unit: 'W/m²',
      note: '지금 이 순간 지붕 1m² 에 닿고 있는 햇빛의 세기입니다. 출력은 이 값을 따라 움직입니다',
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
    sun: { term: '일사량', amount: stats.irradianceNow, fractionDigits: 0, unit: ' W/m²' },
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

/** 4인 가구가 하루에 쓰는 전력량(kWh). 월 350kWh 기준. */
const HOUSEHOLD_DAY_KWH = 350 / 30;

export interface PaperScale {
  id: ScaleId;
  term: string;
  amount: number;
  unit: string;
  fractionDigits: number;
  /** 숫자에 바로 붙는 우리말 자릿이름 — `SiScale` 의 것을 그대로 받는다 */
  countSuffix?: string;
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
  return stats.totalKwh * CO2_PER_KWH;
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
  /*
    보이는 값만 만·억으로 접는다 (2026-09-07 지시).

    그림 개수와 그림 하나가 뜻하는 양은 접기 전 값으로 셈해야 한다 — 「773만 그루」 를 열두 칸에
    나누면 칸마다 64.4 가 되어, 세라고 그려 둔 그림이 도리어 셈을 요구한다.
  */
  const shown = fractionDigits === 0 ? scaleKoCount(amount, unit) : { amount, unit, fractionDigits };

  return {
    id,
    term,
    amount: shown.amount,
    unit: shown.unit,
    fractionDigits: shown.fractionDigits,
    countSuffix: shown.countSuffix,
    note,
    basis,
    perGlyph,
    glyphs: Math.max(1, Math.min(MAX_GLYPHS, Math.round(amount / perGlyph))),
  };
}

export function paperScales(stats: EduStats, script: PaperScript): PaperScale[] {
  const carbonKg = paperCarbonKg(stats);
  const airconHours = scaleCount((stats.totalKwh * 1000) / AIRCON_WATT, '시간');
  const homeDays = scaleCount(stats.totalKwh / HOUSEHOLD_DAY_KWH, '일');

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
    /*
      승용차 주행거리를 걷어냈다 (2026-09-04 회의).

      「1,200km」 가 얼마나 되는 탄소인지는 운전을 해 본 사람에게나 잡히는 크기다. 학생이
      날마다 만나는 물건으로 바꾸면 같은 값이 그대로 체감된다.
    */
    toScale(
      'aircon',
      '에어컨 가동',
      airconHours.amount,
      airconHours.unit,
      airconHours.fractionDigits,
      script.scales.aircon,
      `에어컨 한 대가 쓰는 ${AIRCON_WATT}W 기준`,
    ),
    toScale(
      'home',
      '4인 가구 사용',
      homeDays.amount,
      homeDays.unit,
      homeDays.fractionDigits,
      script.scales.home,
      `4인 가구가 하루에 쓰는 ${HOUSEHOLD_DAY_KWH.toFixed(1)}kWh 기준`,
    ),
  ];
}
