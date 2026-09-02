import type { HourlyOutput, TrendPoint } from '@/interface/energy';
import { REGION_TOTAL } from './regions';
import { createRandom, pickNumber } from './random';

/** 목업 기준 일출·일몰 시각 (7월 말 충남 기준) */
export const SUNRISE_HOUR = 5.5;
export const SUNSET_HOUR = 19.6;

/**
 * 시간대별 출력(kW) 곡선.
 * 정오를 정점으로 하는 종 모양에 구름 손실을 약간 섞어 실제 발전 곡선처럼 만든다.
 */
function buildHourlyOutput(): HourlyOutput[] {
  const next = createRandom(90218);
  const peakHour = 12.7;
  const spread = 3.35;
  const raw: HourlyOutput[] = [];

  for (let hour = Math.floor(SUNRISE_HOUR); hour <= Math.ceil(SUNSET_HOUR); hour += 1) {
    const bell = Math.exp(-(((hour - peakHour) / spread) ** 2));
    const cloudLoss = hour > 14 && hour < 17 ? pickNumber(next, 0.62, 0.82, 3) : pickNumber(next, 0.9, 1, 3);
    const inRange = hour >= SUNRISE_HOUR && hour <= SUNSET_HOUR;

    raw.push({ hour, kw: inRange ? bell * cloudLoss : 0 });
  }

  // 곡선 아래 면적이 오늘 총 발전량과 맞도록 스케일을 잡는다.
  const area = raw.reduce((sum, point) => sum + point.kw, 0);
  const scale = REGION_TOTAL.todayKwh / area;

  return raw.map((point) => ({ hour: point.hour, kw: Math.round(point.kw * scale) }));
}

export const HOURLY_OUTPUT: HourlyOutput[] = buildHourlyOutput();

export const PEAK_OUTPUT = HOURLY_OUTPUT.reduce(
  (best, point) => (point.kw > best.kw ? point : best),
  HOURLY_OUTPUT[0],
);

/** 지정한 시각(소수 시간)의 출력을 선형 보간으로 구한다. */
export function getOutputAt(hour: number): number {
  if (hour <= SUNRISE_HOUR || hour >= SUNSET_HOUR) return 0;

  const lower = HOURLY_OUTPUT.findLast((point) => point.hour <= hour) ?? HOURLY_OUTPUT[0];
  const upper = HOURLY_OUTPUT.find((point) => point.hour > hour) ?? lower;

  if (upper.hour === lower.hour) return lower.kw;

  const ratio = (hour - lower.hour) / (upper.hour - lower.hour);

  return Math.round(lower.kw + (upper.kw - lower.kw) * ratio);
}

/** 오늘 자정부터 지정 시각까지 누적 발전량(kWh) */
export function getAccumulatedAt(hour: number): number {
  return HOURLY_OUTPUT.reduce((sum, point) => (point.hour <= hour ? sum + point.kw : sum), 0);
}

// 월별 일사량 계절 계수 — 봄·여름이 높고 겨울이 낮다.
/** 월별 일사 계수. 날씨·절감액 달력도 같은 계절성을 따라야 해서 밖으로 내보낸다. */
export const MONTH_FACTOR = [0.58, 0.68, 0.86, 1.04, 1.12, 1.02, 0.94, 1.0, 0.96, 0.84, 0.62, 0.52];

/** 연도별 보급 성장률 — 설비가 매년 늘어 발전량도 함께 증가한다. */
const BASE_YEAR = 2021;
const growthOf = (year: number) => 0.66 + (year - BASE_YEAR) * 0.07;

export type PeriodKey = 'day' | 'month' | 'year';

export const PERIOD_META: Record<PeriodKey, { label: string }> = {
  day: { label: '일별' },
  month: { label: '월별' },
  year: { label: '연도별' },
};

function buildDailyTrend(year: number, month: number): TrendPoint[] {
  // 같은 달이면 항상 같은 값이 나오도록 연·월에서 시드를 만든다.
  const next = createRandom(year * 100 + month + 44121);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const seasonal = MONTH_FACTOR[month];
  const base = REGION_TOTAL.todayKwh * seasonal * growthOf(year);

  return Array.from({ length: daysInMonth }, (_, index) => {
    const weather = pickNumber(next, 0.52, 1.12, 3);

    return {
      label: `${index + 1}일`,
      generation: Math.round(base * weather),
      irradiance: Math.round(pickNumber(next, 240, 640) * seasonal),
      previous: Math.round(base * pickNumber(next, 0.5, 1.05, 3)),
    };
  });
}

function buildMonthlyTrend(year: number): TrendPoint[] {
  const next = createRandom(year + 77310);
  const base = REGION_TOTAL.monthKwh * growthOf(year);

  return MONTH_FACTOR.map((factor, index) => ({
    label: `${index + 1}월`,
    generation: Math.round(base * factor * pickNumber(next, 0.94, 1.06, 3)),
    irradiance: Math.round(pickNumber(next, 260, 580) * factor),
    previous: Math.round(base * factor * pickNumber(next, 0.84, 0.99, 3)),
  }));
}

/** 선택한 연도까지 최근 6년 */
function buildYearlyTrend(endYear: number): TrendPoint[] {
  const next = createRandom(endYear + 10905);
  const base = REGION_TOTAL.monthKwh * 12;

  return Array.from({ length: 6 }, (_, index) => {
    const year = endYear - 5 + index;

    return {
      label: `${year}년`,
      generation: Math.round(base * growthOf(year) * pickNumber(next, 0.97, 1.04, 3)),
      irradiance: Math.round(pickNumber(next, 360, 440)),
      previous: Math.round(base * growthOf(year - 1) * pickNumber(next, 0.97, 1.04, 3)),
    };
  });
}

// 같은 기준일을 다시 물어보는 일이 잦아 한 번 만든 결과는 남겨 둔다.
const trendCache = new Map<string, TrendPoint[]>();

/** 기준일과 집계 단위로 추이 데이터를 만든다. */
export function getTrend(period: PeriodKey, date: Date): TrendPoint[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const key = period === 'day' ? `day-${year}-${month}` : period === 'month' ? `month-${year}` : `year-${year}`;
  const cached = trendCache.get(key);

  if (cached) return cached;

  const built = period === 'day'
    ? buildDailyTrend(year, month)
    : period === 'month'
      ? buildMonthlyTrend(year)
      : buildYearlyTrend(year);

  trendCache.set(key, built);

  return built;
}

/** 하루를 시간 단위로 쪼갠 추이. 선택한 날짜마다 값이 다르다. */
function buildHourlyTrend(date: Date): TrendPoint[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const next = createRandom(year * 10000 + month * 100 + date.getDate() + 60271);
  const seasonal = MONTH_FACTOR[month];
  const weather = pickNumber(next, 0.55, 1.1, 3);
  const dailyTotal = REGION_TOTAL.todayKwh * seasonal * growthOf(year) * weather;

  const shape = Array.from({ length: 24 }, (_, hour) => {
    if (hour <= SUNRISE_HOUR || hour >= SUNSET_HOUR) return 0;

    const bell = Math.exp(-(((hour - 12.7) / 3.35) ** 2));
    const cloud = hour > 14 && hour < 17 ? pickNumber(next, 0.6, 0.9, 3) : pickNumber(next, 0.9, 1, 3);

    return bell * cloud;
  });

  const area = shape.reduce((sum, value) => sum + value, 0) || 1;
  const scale = dailyTotal / area;
  const previousWeather = pickNumber(next, 0.5, 1.05, 3);

  return shape.map((value, hour) => ({
    label: `${String(hour).padStart(2, '0')}시`,
    generation: Math.round(value * scale),
    // 그 시각의 일사강도(W/m²). 맑은 정오가 STC(1,000)에 가깝다.
    irradiance: Math.round(value * 980),
    previous: Math.round(value * scale * previousWeather),
  }));
}

const hourlyCache = new Map<string, TrendPoint[]>();

export function getHourlyTrend(date: Date): TrendPoint[] {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const cached = hourlyCache.get(key);

  if (cached) return cached;

  const built = buildHourlyTrend(date);

  hourlyCache.set(key, built);

  return built;
}

/**
 * 집계 단위 한 칸을 한 단계 더 잘게 쪼갠 추이.
 * 일별을 고르면 시간별, 월별을 고르면 일별, 연도별을 고르면 월별이 나온다.
 */
export function getDetailTrend(period: PeriodKey, date: Date): TrendPoint[] {
  if (period === 'day') return getHourlyTrend(date);
  if (period === 'month') return getTrend('day', date);

  return getTrend('month', date);
}

/** 상세 시점의 단위 이름 */
export const DETAIL_UNIT: Record<PeriodKey, string> = {
  day: '시간',
  month: '일',
  year: '월',
};

/** 상세 추이 카드의 제목 — '일대별' 같은 말이 되지 않도록 따로 둔다. */
export const DETAIL_TITLE: Record<PeriodKey, string> = {
  day: '시간대별',
  month: '일자별',
  year: '월별',
};

/** 상세 조회 구간 설명 */
export function describeDetail(period: PeriodKey, date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (period === 'day') return `${year}년 ${month}월 ${date.getDate()}일 · 00시 ~ 23시`;
  if (period === 'month') return `${year}년 ${month}월 1일 ~ ${new Date(year, month, 0).getDate()}일`;

  return `${year}년 1월 ~ 12월`;
}

/** 차트에서 기준일에 해당하는 막대를 짚어 낼 때 쓰는 라벨 */
export function labelOf(period: PeriodKey, date: Date): string {
  if (period === 'day') return `${date.getDate()}일`;
  if (period === 'month') return `${date.getMonth() + 1}월`;

  return `${date.getFullYear()}년`;
}

/** 화면에 적어 줄 조회 구간 설명 */
export function describePeriod(period: PeriodKey, date: Date): string {
  const year = date.getFullYear();

  if (period === 'day') {
    const month = date.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    return `${year}년 ${month}월 1일 ~ ${daysInMonth}일`;
  }

  if (period === 'month') return `${year}년 1월 ~ 12월`;

  return `${year - 5}년 ~ ${year}년`;
}

/**
 * 표시 단위를 값의 크기에 맞춰 고른다.
 * 발전소 하나를 선택하면 수치가 1/100 이하로 줄어 GWh 로는 읽을 수 없기 때문이다.
 */
export function pickEnergyUnit(maxKwh: number): { divider: number; unit: string } {
  if (maxKwh >= 5_000_000) return { divider: 1_000_000, unit: 'GWh' };
  if (maxKwh >= 5_000) return { divider: 1_000, unit: 'MWh' };

  return { divider: 1, unit: 'kWh' };
}

/** 누적 지표 — 홈 KPI와 환경 기여도에서 함께 쓴다. */
/** CO₂ 배출계수 (환경부 고시) — 발전량을 저감량으로 옮길 때 쓴다 */
export const CO2_PER_KWH = 0.4594;

export const CUMULATIVE = {
  /** 시스템 가동 이후 누적 발전량(kWh) */
  totalKwh: 148_620_000,
  /** CO₂ 배출계수 0.4594 kgCO₂/kWh 적용 */
  co2SavedKg: Math.round(148_620_000 * CO2_PER_KWH),
  /** 30년생 소나무 1그루 연간 흡수량 6.6kgCO₂ */
  pineTrees: Math.round((148_620_000 * CO2_PER_KWH) / 6.6),
  /** 4인 가구 월평균 사용량 350kWh 기준 */
  households: Math.round(148_620_000 / 350 / 12),
};
