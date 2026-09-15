import { CO2_PER_KWH, getOutputAt, getTrend, HOURLY_OUTPUT } from '@/mocks/generation';
import { NOW_HOUR, TODAY } from '@/mocks/today';
import { scaleCarbon, scaleSi } from '@/utils/format';
import type { SiScale } from '@/utils/format';
import type { ControlRoomData } from '@/pages/ControlRoom/useControlRoomData';

/**
 * 도 전체 요약 띠의 한 덩이 — 〈추이선 + 이름 + 값 + 견줌〉.
 *
 * 증권 앱 맨 위의 시장 지표 띠를 우리 것으로 옮긴 것이다. 고른 대상 하나만 말하던 이 화면에
 * 「도 전체는 지금 어떤가」 를 말하는 자리를 낸다. 값은 상황판 공용 집계(`data`)에서, 추이선과
 * 견줌은 목업의 시계열(`@/mocks/generation`)에서 가져온다 — 없는 값을 지어내지 않는다.
 */
export interface SummaryMetric {
  key: string;
  name: string;
  /** CountUp 이 굴려 올릴 값(자릿수에 맞춰 이미 M·G·t 로 접힌 뒤의 수). */
  amount: number;
  fractionDigits: number;
  /** 값에 붙는 단위 — 값과 다른 크기로 그린다. */
  unit: string;
  /** 숫자에 바로 붙는 우리말 자릿이름(「만」·「억」). scaleKoCount 계열에서만 채워진다. */
  countSuffix?: string;
  /**
   * 스파크라인에 넘길 값들. 목업에 시계열이 있는 지표만 채우고, 이용률·가동개소처럼 시점 하나로
   * 끝나는 지표는 빈 배열로 둔다 — 추세선을 억지로 지어내면 없는 흐름을 있는 듯 그리게 된다.
   */
  spark: number[];
  /** 견줌 — 오름/내림 비율(예: 0.08 = ▲8%). 수준 지표는 undefined. */
  delta?: number;
  /** 견줌의 기준 이름(「전일 대비」) 또는 수준 지표의 한마디(「전체 정상」). */
  note: string;
}

/** 두 값의 증감 비율. 기준이 0 이거나 없으면 0(견줌 없음)으로 본다. */
function ratio(now: number | undefined, base: number | undefined): number {
  if (!now || !base) return 0;

  return (now - base) / base;
}

/** 값 배열을 앞에서부터 누계로 바꾼다 — 「올해 누적」의 상승선을 그린다. */
function runningSum(values: number[]): number[] {
  let acc = 0;

  return values.map((value) => (acc += value));
}

/** kWh 를 자릿수에 맞춰 접는다 — 발전량이 1천~100만 사이일 때만 소수 한 자리를 둔다(formatEnergy 와 같은 규칙). */
function energyScale(kwh: number): SiScale {
  return scaleSi(kwh, 'Wh', kwh >= 1_000 && kwh < 1_000_000 ? 1 : undefined);
}

/** SiScale 를 지표의 값 세 칸(amount·unit·fractionDigits)으로 편다. */
function fromScale(scale: SiScale): Pick<SummaryMetric, 'amount' | 'unit' | 'fractionDigits' | 'countSuffix'> {
  return {
    amount: scale.amount,
    unit: scale.unit,
    fractionDigits: scale.fractionDigits,
    countSuffix: scale.countSuffix,
  };
}

/**
 * 도 전체 요약 지표 여덟 — 앞 넷은 금일 실적, 뒤 넷은 누적·환경·설비다.
 *
 * 값은 조회된 전체(`data.totals`)에서 읽는다. 조회 조건이 걸리면 그만큼 좁아지지만, 이 화면은
 * 도 전체를 걸어 두고 보는 자리라 조건 없는 전체가 예사다. 추이선과 견줌은 도 전체 시계열을
 * 따르므로, 값과 출처가 다를 수 있어도 「도 전체가 어제·지난달보다 늘었나 줄었나」 라는 같은
 * 물음에 답한다.
 */
export function buildSummaryMetrics(data: ControlRoomData): SummaryMetric[] {
  const { totals, rows, abnormalCount } = data;

  const daily = getTrend('day', TODAY.toDate());
  const monthly = getTrend('month', TODAY.toDate());
  const todayIdx = TODAY.date() - 1; // 30일 → 마지막에서 둘째가 어제
  const monthIdx = TODAY.month(); // 7월(0부터 6). 올해 누계는 0..monthIdx

  // 금일 — 최근 열두 날의 발전량 곡선과 전일 대비.
  const dailyGen = daily.map((point) => point.generation);
  const dayDelta = ratio(daily[todayIdx]?.generation, daily[todayIdx - 1]?.generation);

  // 현재 출력 — 오늘 일출부터 지금까지의 출력 곡선과 한 시간 전 대비.
  const hourSpark = HOURLY_OUTPUT.filter((point) => point.hour <= Math.ceil(NOW_HOUR)).map((point) => point.kw);
  const hourDelta = ratio(getOutputAt(NOW_HOUR), getOutputAt(NOW_HOUR - 1));

  // 이번 달 — 올해 월별 발전량 곡선과 전월 대비.
  const monthGen = monthly.slice(0, monthIdx + 1).map((point) => point.generation);
  const monthDelta = ratio(monthly[monthIdx]?.generation, monthly[monthIdx - 1]?.generation);

  // 올해 누적 — 월누계 상승선과 전년 대비(같은 달까지의 올해 누계 vs 지난해 누계).
  const cumGen = runningSum(monthGen);
  const cumThis = monthGen.reduce((sum, value) => sum + value, 0);
  const cumPrev = monthly.slice(0, monthIdx + 1).reduce((sum, point) => sum + point.previous, 0);
  const yearDelta = ratio(cumThis, cumPrev);
  const carbonCum = cumGen.map((value) => value * CO2_PER_KWH);

  const hours = totals.capacityKw > 0 ? totals.todayKwh / totals.capacityKw : 0;
  const utilization = rows.length > 0 ? rows.reduce((sum, row) => sum + row.utilization, 0) / rows.length : 0;

  return [
    {
      key: 'today',
      name: '관내 총 발전량',
      ...fromScale(energyScale(totals.todayKwh)),
      spark: dailyGen.slice(-12),
      delta: dayDelta,
      note: '전일 대비',
    },
    {
      key: 'output',
      name: '현재 총출력',
      ...fromScale(scaleSi(totals.outputKw, 'W')),
      spark: hourSpark,
      delta: hourDelta,
      note: '1시간 전',
    },
    {
      key: 'hours',
      name: '평균 발전시간',
      amount: hours,
      fractionDigits: 1,
      unit: 'h',
      spark: dailyGen.slice(-12),
      delta: dayDelta,
      note: '전일 대비',
    },
    {
      key: 'month',
      name: '이번 달 발전량',
      ...fromScale(energyScale(totals.monthKwh)),
      spark: monthGen,
      delta: monthDelta,
      note: '전월 대비',
    },
    {
      key: 'year',
      name: '올해 누적 발전량',
      ...fromScale(energyScale(totals.yearKwh)),
      spark: cumGen,
      delta: yearDelta,
      note: '전년 대비',
    },
    {
      key: 'carbon',
      name: '탄소저감(올해)',
      ...fromScale(scaleCarbon(totals.yearKwh * CO2_PER_KWH)),
      spark: carbonCum,
      delta: yearDelta,
      note: '전년 대비',
    },
    {
      key: 'util',
      name: '평균 이용률',
      amount: utilization * 100,
      fractionDigits: 1,
      unit: '%',
      spark: [],
      note: '관내 평균',
    },
    {
      key: 'plants',
      name: '가동 개소',
      amount: Math.max(rows.length - abnormalCount, 0),
      fractionDigits: 0,
      unit: '개소',
      spark: [],
      note: abnormalCount > 0 ? `이상 ${abnormalCount}개소` : '전체 정상',
    },
  ];
}

/** 한 번에 보이는 덩이 수 — 밀도를 흉내 내지 않도록 한 행에 넷까지만 둔다(반드시 지킬 선). */
export const SUMMARY_PER_PAGE = 4;
