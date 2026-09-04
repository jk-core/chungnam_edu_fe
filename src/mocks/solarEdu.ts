/**
 * 학생 교육용 대시보드가 쓰는 계산값 (SFR-005).
 *
 * 여기는 수치만 만든다 — 눈높이에 따라 갈리는 문구·지표 선택은 `mocks/eduContent.ts` 몫이다.
 * 교육 목적 값이라 한전·산림청 공식 계수를 다루는 utils/eco.ts 와는 따로 둔다.
 */

import { getHourlyTrend } from './generation';
import { getNodeStat } from './nodeStats';
import { isProducing } from './status';
import { NOW_HOUR, TODAY } from './today';
import type { ScopeNode } from './tree';

/**
 * 설치된 모듈 사양.
 * 면적당 효율과 kW 당 소요 면적은 서로 맞물린다 — 4.9 m²/kW × 20.3% ≈ 1kW/(1,000W/m²) 이라,
 * 이 두 값이면 "일사 × 면적 × 효율 = 설비용량" 이 성립한다.
 */
export const MODULE_SPEC = {
  efficiency: 0.203,
  areaPerKw: 4.9,
};

/**
 * 맑은 날 정오의 일사강도(W/m²). 햇빛 세기를 100점 만점으로 환산하는 기준이다.
 * 수준별 대본이 저마다 이 값으로 점수를 내므로, 셈의 근거는 수치 쪽인 여기에 둔다.
 */
export const FULL_SUN_WM2 = 1000;

/**
 * 설치 이후 총계를 셈하는 기준 (목업).
 *
 * 발전소마다 준공일이 다르지만 목업에는 그 날짜가 없다. 설비용량에 연간 등가 가동시간과 햇수를
 * 곱해 쌓아 두면 조회 대상이 학교든 도 전체든 같은 규칙으로 늘어난다 — 실제 연동이 붙으면
 * 이 두 상수 대신 서버가 낸 누적값을 그대로 받는다.
 */
const YEARLY_FULL_HOURS = 1_314;
const YEARS_RUNNING = 4.5;

/**
 * 해가 떠 있다고 볼 최소 일사량(W/m²).
 * 새벽·해질녘의 희미한 빛까지 「발전해야 할 시간」 으로 세면 하루 두 번 멎었다고 알리게 된다.
 */
const DAYLIGHT_WM2 = 80;

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
  /** 설치 이후 지금까지 만든 총 발전량(kWh) */
  totalKwh: number;
  /** 지금 출력 ÷ 설비용량 */
  loadRatio: number;
  /** 지금 일사강도(W/m²) */
  irradianceNow: number;
  /** 등가 발전시간(h) = 하루 발전량 ÷ 설비용량 */
  equivalentHours: number;
  /** 이용률 = 하루 발전량 ÷ (설비용량 × 24h) */
  capacityFactor: number;
  /** 같은 일사에서 기대되는 하루 발전량(kWh) */
  expectedKwh: number;
  /** 시간대별 발전량(kWh) 24칸 */
  hourly: number[];
  /** 시간대별 일사강도(W/m²) 24칸 — 계측은 시점 강도만 하고 적산하지 않는다 */
  irradianceSeries: number[];
  /** 이 값이 어느 시각 기준인지 (소수 시간, 예: 14.25 = 14시 15분) */
  nowHour: number;
  /** 계측값이 들어오고 있는지 */
  isLive: boolean;
  /**
   * 완전히 멎었는지 — 해는 떠 있는데 출력이 0 인 상태 (SFR-005-10).
   *
   * 임계값으로 고장을 가리지는 않는다. 시군마다 센서 편차가 커서 정확도가 나오지 않고, 임계를
   * 낮추면 상시 걸린다 (2026-09-04 회의). 「일사는 있는데 아무것도 만들지 못하고 있다」 는
   * 한 가지만 짚는다 — 이건 센서 편차와 무관하게 확실하다.
   */
  isStopped: boolean;
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
  const irradianceNow = Math.round(irradianceSeries[hourIndex] ?? 0);
  const outputKw = live ? Math.round((stat.hourly[hourIndex] ?? 0) * 10) / 10 : 0;

  return {
    outputKw,
    capacityKw,
    moduleArea: Math.round(capacityKw * MODULE_SPEC.areaPerKw),
    todayKwh: Math.round(sumTo(stat.hourly)),
    dayKwh: Math.round(dayKwh),
    totalKwh: Math.round(capacityKw * YEARLY_FULL_HOURS * YEARS_RUNNING),
    loadRatio: capacityKw > 0 && live ? (stat.hourly[hourIndex] ?? 0) / capacityKw : 0,
    irradianceNow,
    equivalentHours: capacityKw > 0 ? dayKwh / capacityKw : 0,
    capacityFactor: capacityKw > 0 ? dayKwh / (capacityKw * 24) : 0,
    expectedKwh: Math.round(stat.expectedKwh),
    hourly: stat.hourly,
    irradianceSeries,
    nowHour,
    isLive: live,
    isStopped: irradianceNow >= DAYLIGHT_WM2 && outputKw === 0,
  };
}

/** 하단 티커 — 알고 계셨나요 */
export const EDU_FACTS: string[] = [
  '태양전지는 뜨거워지면 오히려 전기를 덜 만들어요. 같은 햇빛이라도 한여름보다 봄·가을에 더 잘 만드는 이유예요.',
  '판 위에 쌓인 먼지와 황사는 전기를 5~10% 까지 줄여요. 그래서 때맞춰 닦아 주는 일이 중요해요.',
  '태양전지는 한 장씩 쓰지 않고 여러 장을 줄로 이어 붙여요. 그래서 한 장만 그늘져도 그 줄 전체가 만드는 전기가 함께 줄어요.',
  '그늘진 전지를 건너뛰게 해 주는 부품이 따로 있어요. 한 장 때문에 줄 전체가 멈추는 일을 막아 줘요.',
  '전기는 설비 크기(kW)가 아니라 실제로 만든 양(kWh)으로 세요. 크기는 낼 수 있는 최대치이고, 양은 결과예요.',
];
