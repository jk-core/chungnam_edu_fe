/**
 * 학생 교육용 대시보드 콘텐츠 (SFR-005).
 *
 * 눈높이는 고등학생이다 — 초등 수준의 비유 대신 물리적 원리와 정량 지표를 쓴다.
 * 단위·계수·계산식을 감추지 않고 드러내, 화면 자체가 설명이 되도록 한다.
 * 교육 목적 값이라 한전·산림청 공식 계수를 다루는 utils/eco.ts 와는 따로 둔다.
 */

import { CO2_PER_KWH, CO2_PER_TREE_YEAR } from '@/utils/eco';
import { getHourlyTrend } from './generation';
import { getNodeStat } from './nodeStats';
import { isProducing } from './status';
import { NOW_HOUR, TODAY } from './today';
import type { ScopeNode } from './tree';

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
    state: '햇빛 에너지',
    detail: '맑은 날 정오에 땅에 닿는 햇빛은 1m² 당 약 1,000W 예요. 이 세기가 만들 수 있는 전기의 한계를 정해요.',
  },
  {
    id: 'panel',
    label: '태양전지',
    state: '직류 전기',
    detail: '햇빛이 태양전지에 닿으면 전자가 한쪽으로 밀려나면서 전기가 생겨요. 한 방향으로만 흐르는 직류예요.',
  },
  {
    id: 'inverter',
    label: '인버터',
    state: '교류 전기',
    detail: '태양전지가 만든 직류를 교류로 바꿔요. 학교와 집에서 쓰는 전기가 교류이기 때문이에요.',
  },
  {
    id: 'load',
    label: '학교·전기망',
    state: '쓰거나 내보내기',
    detail: '학교가 먼저 쓰고, 남으면 한전 전기망으로 내보내요. 그래서 만든 양과 쓴 양을 따로 재요.',
  },
];

/** 원리 카드 — 아래 STAGE_POINTS 가 단계별로 나눠 쓴다 */
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
      '빛은 아주 작은 알갱이로 와요. 이 알갱이가 가진 힘이 전자를 붙잡고 있는 힘보다 세면, 붙잡혀 있던 전자가 ' +
      '떨어져 나와 자유롭게 움직여요. 우리 눈에 보이는 빛이면 대부분 이 조건을 넘어요.',
  },
  {
    id: 'pn',
    term: 'PN 접합',
    summary: '전자를 한쪽으로만 흐르게 하는 구조',
    body:
      '전자가 자유로워지기만 해서는 전기가 되지 않아요. 한 방향으로 몰아 주어야 흐름, 곧 전류가 되죠. ' +
      '전자가 남는 N형과 모자라는 P형을 맞붙이면 경계에 미는 힘이 생겨서, 빛으로 떨어져 나온 전자를 한쪽으로 보내 줘요.',
  },
  {
    id: 'inverter',
    term: '인버터',
    summary: '직류를 교류로 바꾸는 장치',
    body:
      '태양전지가 만든 전기는 한 방향으로만 흐르는 직류인데, 학교와 집에서 쓰는 전기는 1초에 60번 방향이 바뀌는 교류예요. ' +
      '인버터는 아주 빠른 스위치를 여닫아 직류를 교류 모양으로 바꿔요. 이때 2~5% 는 열로 사라져요.',
  },
  {
    id: 'mppt',
    term: '최대전력점 추종(MPPT)',
    summary: '가장 많이 뽑히는 지점을 계속 찾는 기능',
    body:
      '태양전지는 전압을 높이면 전류가 줄고, 전류를 늘리면 전압이 떨어져요. 둘을 곱한 값이 가장 커지는 지점이 딱 하나 있는데, ' +
      '그 자리가 햇빛과 온도에 따라 계속 움직여요. 인버터는 그 지점을 쉬지 않고 따라가요.',
  },
];

/**
 * 계통도 아래에 붙는 세 가지 이야기 (SFR-005-01/02/05).
 * 화면을 넘기지 않고 한눈에 보는 자리라, 주제마다 두세 줄로 끊는다.
 */
export interface EduTopic {
  id: 'meaning' | 'principle' | 'effect';
  title: string;
  body: string;
}

export const EDU_TOPICS: EduTopic[] = [
  {
    id: 'meaning',
    title: '왜 학교 지붕일까요',
    body:
      '넓고 비어 있는 지붕을 그대로 쓰니 따로 땅을 마련하지 않아도 돼요. 쓰는 곳에서 바로 만드니 멀리 보내며 잃는 전기도 없고요. ' +
      '무엇보다 학생들이 매일 지나다니며 발전 설비를 직접 볼 수 있어요.',
  },
  {
    id: 'principle',
    title: '햇빛이 전기가 되는 원리',
    body:
      '빛 알갱이가 태양전지에 부딪히면 전자가 떨어져 나오고, PN 접합이 그 전자를 한 방향으로 몰아 전류를 만들어요. ' +
      '이렇게 얻은 직류를 인버터가 교류로 바꿔 학교로 보내요.',
  },
  {
    id: 'effect',
    title: '무엇이 달라질까요',
    body:
      '여기서 만든 만큼 화력발전소가 덜 돌아가요. 태우지 않은 연료가 곧 줄어든 온실가스이고, ' +
      '왼쪽의 나무 그루 수는 그 양을 소나무가 1년 동안 마시는 양으로 바꿔 본 거예요.',
  },
];

/** 발전량 환산 — 계산 근거를 함께 적는다 (SFR-005-03) */
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
    perKwh: CO2_PER_KWH,
    unit: 'kg CO₂',
    basis: `전기 1kWh 를 만들 때 나오는 ${CO2_PER_KWH}kg 으로 셈했어요`,
    fractionDigits: 0,
  },
  {
    id: 'tree',
    label: '나무를 심은 효과',
    // 줄인 CO₂ 를 소나무가 1년 동안 마시는 양으로 나눈다. 계수는 utils/eco 와 한 곳을 본다.
    perKwh: CO2_PER_KWH / CO2_PER_TREE_YEAR,
    unit: '그루',
    basis: `소나무 한 그루가 1년에 마시는 ${CO2_PER_TREE_YEAR}kg 으로 셈했어요`,
    fractionDigits: 0,
  },
  {
    id: 'household',
    label: '네 식구가 쓰는 날',
    perKwh: 1 / (350 / 30),
    unit: '일',
    basis: '한 집이 하루에 쓰는 11.7kWh 로 셈했어요',
    fractionDigits: 1,
  },
  {
    id: 'led',
    label: '교실 조명 켜는 시간',
    perKwh: 25,
    unit: '시간',
    basis: '40W 짜리 조명 하나를 켠다고 셈했어요',
    fractionDigits: 0,
  },
];

/**
 * 설치된 모듈 사양.
 * 면적당 효율과 kW 당 소요 면적은 서로 맞물린다 — 4.9 m²/kW × 20.3% ≈ 1kW/(1,000W/m²) 이라,
 * 이 두 값이면 "일사 × 면적 × 효율 = 설비용량" 이 성립한다.
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
  /** 같은 일사에서 기대되는 하루 발전량(kWh) */
  expectedKwh: number;
  /** 시간대별 발전량(kWh) 24칸 */
  hourly: number[];
  /** 시간대별 일사(kWh/m²) 24칸 */
  irradianceSeries: number[];
  /** 이 값이 어느 시각 기준인지 (소수 시간, 예: 14.25 = 14시 15분) */
  nowHour: number;
  /** 계측값이 들어오고 있는지 */
  isLive: boolean;
}

/**
 * 화면의 여러 패널이 나눠 쓰는 계산값을 한 번에 만든다.
 * 발전량·기대발전량은 진단 화면과 같은 `getNodeStat` 을 쓴다 — 같은 학교인데 화면마다
 * 값이 다르게 보이면 교육 자료로서 신뢰를 잃는다.
 *
 * `nowHour` 를 밖에서 받는 이유는, 이 화면만 벽시계를 따라가기 때문이다.
 * 다른 화면은 목업 기준 시각(`NOW_HOUR`)에 묶여 있어야 알림·점검 이력과 아귀가 맞으므로
 * 기본값은 그대로 두고, 교육용 화면에서만 실제 시각을 넘긴다.
 */
export function buildEduStats(node: ScopeNode, nowHour: number = NOW_HOUR): EduStats {
  const date = TODAY.toDate();
  const stat = getNodeStat(node, 'day', date);
  const irradianceSeries = getHourlyTrend(date).map((point) => point.irradiance);
  // 아직 오지 않은 시간은 빼고 "지금까지" 만 더한다.
  const passed = Math.ceil(nowHour);
  const sumTo = (series: number[]) => series.slice(0, passed).reduce((sum, value) => sum + value, 0);

  const live = isProducing(node.status);
  const hourIndex = Math.min(23, Math.max(0, Math.floor(nowHour)));
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
    expectedKwh: Math.round(stat.expectedKwh),
    hourly: stat.hourly,
    irradianceSeries,
    nowHour,
    isLive: live,
  };
}

/** 하단 티커 — 알고 계셨나요 */
export const EDU_FACTS: string[] = [
  '태양전지는 뜨거워지면 오히려 힘이 떨어져요. 같은 햇빛이라도 한여름보다 봄·가을에 더 잘 만드는 이유예요.',
  '판 위에 쌓인 먼지와 황사는 전기를 5~10% 까지 줄여요. 그래서 때맞춰 닦아 주는 일이 중요해요.',
  '태양전지는 한 장씩 쓰지 않고 여러 장을 줄로 이어 붙여요. 그래서 한 장만 그늘져도 그 줄 전체가 힘을 잃어요.',
  '그늘진 전지를 건너뛰게 해 주는 부품이 따로 있어요. 한 장 때문에 줄 전체가 멈추는 일을 막아 줘요.',
  '전기는 설비 크기(kW)가 아니라 실제로 만든 양(kWh)으로 세요. 크기는 낼 수 있는 최대치이고, 양은 결과예요.',
];
