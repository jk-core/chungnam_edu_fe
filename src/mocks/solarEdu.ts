/**
 * 학생 교육용 대시보드 콘텐츠 (SFR-005).
 *
 * 눈높이는 고등학생이다 — 초등 수준의 비유 대신 물리적 원리와 정량 지표를 쓴다.
 * 단위·계수·계산식을 감추지 않고 드러내, 화면 자체가 설명이 되도록 한다.
 * 교육 목적 값이라 한전·산림청 공식 계수를 다루는 utils/eco.ts 와는 따로 둔다.
 */

import { getHourlyTrend } from './generation';
import { getNodeStat } from './nodeStats';
import { isProducing } from './status';
import { NOW_HOUR, TODAY } from './today';
import type { ScopeNode } from './tree';

/**
 * 자동으로 넘어가는 씬.
 *
 * 씬 하나가 한 화면을 받는 만큼, 카드 서너 장으로 끝나는 주제는 따로 두지 않고 묶는다 —
 * 지금 이 순간의 수치는 화면 위쪽에 늘 떠 있으니 씬에서 빼고, 효율과 환산은 "잘 만들고
 * 있는지 / 그게 무슨 뜻인지" 라는 한 흐름이라 한 씬에서 잇는다.
 */
export type SceneKey = 'principle' | 'curve' | 'meaning';

export interface SceneMeta {
  key: SceneKey;
  /** 회전 영역 맨 위에 붙는 제목 */
  title: string;
  /** 이 씬이 답하는 질문 */
  question: string;
}

export const SCENES: SceneMeta[] = [
  { key: 'principle', title: '전기가 되는 과정', question: '햇빛은 어떻게 교실의 전기가 될까?' },
  { key: 'curve', title: '하루의 발전 곡선', question: '왜 정오 무렵에 가장 많이 만들까?' },
  { key: 'meaning', title: '효율과 의미', question: '잘 만들고 있는지, 그 전기는 무슨 뜻인지' },
];

/** 전기가 되기까지의 단계 (SFR-005-02) */
export interface JourneyStage {
  id: string;
  label: string;
  /** 그 단계에서 전기가 어떤 상태인지 */
  state: string;
  detail: string;
}

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: 'sun',
    label: '햇빛',
    state: '복사에너지',
    detail: '지표에 닿는 일사량은 맑은 날 정오에 약 1,000 W/m² 다. 이 값이 발전량의 상한을 정한다.',
  },
  {
    id: 'panel',
    label: '태양전지',
    state: '직류 전기',
    detail: '반도체 PN 접합에 빛이 닿으면 전자와 정공이 갈라지며 전위차가 생긴다. 광전효과를 전력으로 쓰는 셈이다.',
  },
  {
    id: 'inverter',
    label: '인버터',
    state: '교류 전기',
    detail: '태양전지가 만든 직류를 60Hz 교류로 바꾼다. 가정·학교의 배전망이 교류를 쓰기 때문이다.',
  },
  {
    id: 'load',
    label: '학교·계통',
    state: '소비 또는 송전',
    detail: '학교가 먼저 쓰고 남으면 한전 계통으로 보낸다. 그래서 발전량과 사용량은 따로 계량한다.',
  },
];

/** 원리 카드 — 씬 2에서 순환 없이 한 번에 펼친다 */
export interface PrincipleCard {
  id: string;
  term: string;
  /** 한 줄 정의 */
  summary: string;
  body: string;
}

export const PRINCIPLES: PrincipleCard[] = [
  {
    id: 'photovoltaic',
    term: '광전효과',
    summary: '빛이 전자를 밀어내는 현상',
    body:
      '빛은 광자라는 알갱이로 온다. 광자 하나의 에너지가 반도체의 밴드갭보다 크면 붙잡혀 있던 전자가 떨어져 나와 자유롭게 움직인다. ' +
      '실리콘의 밴드갭은 약 1.1eV 이고 가시광선 광자는 대개 1.7~3.1eV 라, 우리 눈에 보이는 빛이면 이 조건을 넉넉히 넘는다.',
  },
  {
    id: 'pn',
    term: 'PN 접합',
    summary: '전자가 한쪽으로만 흐르게 만드는 구조',
    body:
      '전자가 자유로워지기만 해서는 전기가 되지 않는다. 한 방향으로 몰아 주어야 흐름, 곧 전류가 된다. ' +
      '전자가 남는 N형과 모자라는 P형 반도체를 맞붙이면 경계에 전기장이 생기고, 빛으로 생긴 전자와 정공이 이 전기장에 밀려 서로 반대쪽으로 갈라진다.',
  },
  {
    id: 'inverter',
    term: '인버터',
    summary: '직류를 교류로 바꾸는 장치',
    body:
      '태양전지가 내놓는 전기는 한 방향으로만 흐르는 직류인데, 학교와 가정의 배전망은 초당 60번 방향이 바뀌는 교류를 쓴다. ' +
      '인버터는 스위칭 소자를 빠르게 여닫아 직류를 잘게 썰고 이어 붙여 교류 파형을 만든다. 이 과정에서 2~5% 가 열로 빠져나간다.',
  },
  {
    id: 'mppt',
    term: '최대전력점 추종(MPPT)',
    summary: '가장 많이 뽑히는 지점을 계속 찾는 제어',
    body:
      '태양전지에서 전압을 높이면 전류가 줄고, 전류를 늘리면 전압이 떨어진다. 둘의 곱인 전력이 가장 커지는 지점이 딱 하나 있는데 ' +
      '그 자리가 일사량과 온도에 따라 시시각각 움직인다. 인버터는 동작점을 조금씩 흔들어 보며 그 지점을 계속 쫓아간다.',
  },
];

/** 효율 지표 — 씬 4 */
export interface EfficiencyMetric {
  id: string;
  term: string;
  formula: string;
  meaning: string;
}

export const EFFICIENCY_METRICS: EfficiencyMetric[] = [
  {
    id: 'conversion',
    term: '변환효율',
    formula: '출력 전력 ÷ (일사량 × 모듈 면적)',
    meaning:
      '모듈에 쏟아진 햇빛 에너지 중 몇 %가 전기로 바뀌었는지. 설치할 때 정해지는 값으로, 상용 실리콘 모듈은 보통 18~22% 다.',
  },
  {
    id: 'pr',
    term: '성능비 (PR)',
    formula: '실제 발전량 ÷ 기대 발전량',
    meaning:
      '같은 일사에서 나왔어야 할 값 대비 실제로 나온 값. 설비가 제 실력을 내고 있는지 보는 지표로, 80% 아래로 떨어지면 오염·음영·고장을 의심한다.',
  },
  {
    id: 'cf',
    term: '이용률 (CF)',
    formula: '실제 발전량 ÷ (설비용량 × 24시간)',
    meaning:
      '설비를 하루 종일 최대로 돌렸다면 나왔을 양 대비 실제 비율. 태양광은 밤과 흐린 날이 있어 15% 안팎이면 정상이다.',
  },
  {
    id: 'hours',
    term: '등가 발전시간',
    formula: '발전량 ÷ 설비용량',
    meaning:
      '하루치 발전량을 최대 출력으로 환산하면 몇 시간을 돌린 셈인지. 우리나라 연평균은 하루 3.5시간 남짓이다.',
  },
];

/** 씬 5에서 쓰는 환산 — 계산 근거를 함께 적는다 */
export interface ImpactItem {
  id: string;
  label: string;
  /** 1kWh 당 환산값 */
  perKwh: number;
  unit: string;
  basis: string;
  fractionDigits: number;
}

export const IMPACT_ITEMS: ImpactItem[] = [
  {
    id: 'co2',
    label: '줄인 온실가스',
    perKwh: 0.4594,
    unit: 'kg CO₂',
    basis: '전력 배출계수 0.4594 kgCO₂/kWh',
    fractionDigits: 0,
  },
  {
    id: 'led',
    label: '교실 LED 조명',
    perKwh: 25,
    unit: '시간',
    basis: '40W 조명 1개 기준 (1kWh ÷ 0.04kW)',
    fractionDigits: 0,
  },
  {
    id: 'ev',
    label: '전기차 주행',
    perKwh: 5.5,
    unit: 'km',
    basis: '전비 5.5km/kWh 기준',
    fractionDigits: 0,
  },
  {
    id: 'household',
    label: '4인 가구 사용일',
    perKwh: 1 / (350 / 30),
    unit: '일',
    basis: '월 350kWh ÷ 30일 = 하루 11.7kWh',
    fractionDigits: 1,
  },
];

/**
 * 설치된 모듈 사양.
 * 면적당 효율과 kW 당 소요 면적은 서로 맞물린다 — 4.9 m²/kW × 20.3% ≈ 1kW/(1,000W/m²) 이라,
 * 이 두 값이면 "일사 × 면적 × 효율 = 설비용량" 이 성립한다. 씬 4의 계산식이 이 관계를 보여 준다.
 */
export const MODULE_SPEC = {
  efficiency: 0.203,
  areaPerKw: 4.9,
};

/** 교육용 화면이 쓰는 계산값 한 벌 */
export interface EduStats {
  /** 지금 출력(kW) */
  outputKw: number;
  capacityKw: number;
  /** 모듈 전체 면적(m²) */
  moduleArea: number;
  /** 오늘 지금까지 만든 전력량(kWh) */
  todayKwh: number;
  /** 오늘 하루 전체 예상 발전량(kWh) */
  dayKwh: number;
  /** 지금 출력 ÷ 설비용량 */
  loadRatio: number;
  /** 지금 일사강도(W/m²) */
  irradianceNow: number;
  /** 오늘 지금까지 적산 일사(kWh/m²) */
  insolation: number;
  /** 등가 발전시간(h) = 하루 발전량 ÷ 설비용량 */
  equivalentHours: number;
  /** 이용률 = 하루 발전량 ÷ (설비용량 × 24h) */
  capacityFactor: number;
  /** 성능비 */
  pr: number;
  /** 같은 일사에서 기대되는 하루 발전량(kWh) */
  expectedKwh: number;
  /** 시간대별 발전량(kWh) 24칸 */
  hourly: number[];
  /** 시간대별 일사(kWh/m²) 24칸 */
  irradianceSeries: number[];
  /** 계측값이 들어오고 있는지 */
  isLive: boolean;
}

/**
 * 씬 다섯 개가 나눠 쓰는 계산값을 한 번에 만든다.
 * PR·기대발전량은 진단 화면과 같은 `getNodeStat` 을 쓴다 — 같은 학교인데 화면마다
 * 성능비가 다르게 보이면 교육 자료로서 신뢰를 잃는다.
 */
export function buildEduStats(node: ScopeNode): EduStats {
  const date = TODAY.toDate();
  const stat = getNodeStat(node, 'day', date);
  const irradianceSeries = getHourlyTrend(date).map((point) => point.irradiance);
  // 아직 오지 않은 시간은 빼고 "지금까지" 만 더한다.
  const passed = Math.ceil(NOW_HOUR);
  const sumTo = (series: number[]) => series.slice(0, passed).reduce((sum, value) => sum + value, 0);

  const live = isProducing(node.status);
  const hourIndex = Math.min(23, Math.floor(NOW_HOUR));
  const capacityKw = node.capacityKw;
  const dayKwh = stat.generationKwh;

  return {
    outputKw: live ? Math.round((stat.hourly[hourIndex] ?? 0) * 10) / 10 : 0,
    capacityKw,
    moduleArea: Math.round(capacityKw * MODULE_SPEC.areaPerKw),
    todayKwh: Math.round(sumTo(stat.hourly)),
    dayKwh: Math.round(dayKwh),
    loadRatio: capacityKw > 0 && live ? (stat.hourly[hourIndex] ?? 0) / capacityKw : 0,
    irradianceNow: Math.round((irradianceSeries[hourIndex] ?? 0) * 1000),
    insolation: Math.round(sumTo(irradianceSeries) * 100) / 100,
    equivalentHours: capacityKw > 0 ? dayKwh / capacityKw : 0,
    capacityFactor: capacityKw > 0 ? dayKwh / (capacityKw * 24) : 0,
    pr: stat.pr,
    expectedKwh: Math.round(stat.expectedKwh),
    hourly: stat.hourly,
    irradianceSeries,
    isLive: live,
  };
}

/** 하단 티커 — 알아 두면 좋은 사실 */
export const EDU_FACTS: string[] = [
  '태양전지는 온도가 오르면 효율이 떨어진다. 같은 일사량이라도 한여름보다 봄·가을에 성능비가 높게 나오는 이유다.',
  '패널 표면의 먼지와 황사는 출력을 5~10%까지 깎는다. 정기 세척이 발전량 관리의 기본인 까닭이다.',
  '전지 한 장이 아니라 여러 장을 직렬로 잇는 것을 스트링이라 한다. 한 장만 그늘져도 그 줄 전체 출력이 떨어진다.',
  '바이패스 다이오드는 그늘진 전지를 우회시켜 스트링 전체가 멈추는 것을 막는다.',
  '발전량은 설비용량(kW)이 아니라 실제로 만든 전력량(kWh)으로 센다. 용량은 최대치, 발전량은 결과다.',
];
