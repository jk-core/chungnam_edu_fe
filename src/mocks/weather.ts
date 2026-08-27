import dayjs from 'dayjs';
import type { DayWeather, MonthWeather, WeatherKind } from '@/interface/weather';
import { MONTH_FACTOR } from './generation';
import { REGION_TOTAL } from './regions';
import { getSchoolById } from './schools';
import { createRandom, hashSeed, pickNumber } from './random';

/**
 * 날씨별 표기와 일사 감쇄 계수.
 * 실제로는 기상청 API 를 붙이지만(SFR-006-02), 목업에서는 시드 난수로 흉내 낸다.
 */
export const WEATHER_META: Record<WeatherKind, { label: string; factor: number }> = {
  clear: { label: '맑음', factor: 1 },
  partlyCloudy: { label: '구름 조금', factor: 0.88 },
  cloudy: { label: '흐림', factor: 0.62 },
  rain: { label: '비', factor: 0.36 },
  snow: { label: '눈', factor: 0.28 },
};

/** 계절에 맞는 날씨를 고른다. 겨울에는 눈이, 여름에는 비가 잦다. */
function pickWeather(next: () => number, month: number): WeatherKind {
  const roll = next();
  const isWinter = month === 11 || month === 0 || month === 1;
  const isSummer = month >= 5 && month <= 7;

  if (isWinter && roll > 0.86) return 'snow';
  if (isSummer && roll > 0.74) return 'rain';
  if (roll > 0.82) return 'rain';
  if (roll > 0.62) return 'cloudy';
  if (roll > 0.38) return 'partlyCloudy';

  return 'clear';
}

const dayCache = new Map<string, DayWeather>();

/** 하루치 날씨·발전시간. 발전소를 지정하지 않으면 도 전체 기준이다. */
export function getDayWeather(schoolId: string | null, date: Date): DayWeather {
  const ymd = dayjs(date).format('YYYY-MM-DD');
  const key = `${schoolId ?? 'all'}-${ymd}`;
  const cached = dayCache.get(key);

  if (cached) return cached;

  const school = getSchoolById(schoolId);
  const capacityKw = school ? school.capacityKw : REGION_TOTAL.capacityKw;
  // 날씨는 지역 공통이라 발전소를 가리지 않고 날짜만으로 뽑는다.
  const weatherNext = createRandom(hashSeed(`weather-${ymd}`));
  const month = dayjs(date).month();
  const kind = pickWeather(weatherNext, month);
  const seasonal = MONTH_FACTOR[month];
  const meta = WEATHER_META[kind];

  const next = createRandom(hashSeed(key));
  const irradianceWm2 = Math.round(980 * seasonal * meta.factor * pickNumber(next, 0.94, 1.06, 3));
  // 맑은 여름날 4.6h 안팎이 되도록 계수를 잡았다.
  const generationHours = Math.round(4.55 * seasonal * meta.factor * pickNumber(next, 0.95, 1.05, 3) * 100) / 100;
  const generationKwh = Math.round(capacityKw * generationHours);

  const value: DayWeather = {
    date: ymd,
    kind,
    irradianceWm2,
    generationHours,
    generationKwh,
  };

  dayCache.set(key, value);

  return value;
}

/** 한 달치 — 월 달력에 그대로 얹는다. */
export function getMonthDays(schoolId: string | null, year: number, month: number): DayWeather[] {
  const start = dayjs(new Date(year, month, 1));

  return Array.from({ length: start.daysInMonth() }, (_, index) =>
    getDayWeather(schoolId, start.add(index, 'day').toDate()));
}

/** 열두 달치 — 연 달력에 쓴다. */
export function getYearMonths(schoolId: string | null, year: number): MonthWeather[] {
  return Array.from({ length: 12 }, (_, month) => {
    const days = getMonthDays(schoolId, year, month);
    const counts = days.reduce<Partial<Record<WeatherKind, number>>>(
      (acc, day) => ({ ...acc, [day.kind]: (acc[day.kind] ?? 0) + 1 }),
      {},
    );
    const kind = (Object.keys(counts) as WeatherKind[]).reduce(
      (best, item) => ((counts[item] ?? 0) > (counts[best] ?? 0) ? item : best),
      'clear' as WeatherKind,
    );

    return {
      month: `${year}-${String(month + 1).padStart(2, '0')}`,
      generationHours: Math.round(days.reduce((sum, day) => sum + day.generationHours, 0) * 10) / 10,
      kind,
    };
  });
}
