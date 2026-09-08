import dayjs from 'dayjs';
import type { DayWeather, MonthPower, WeatherKind } from '@/interface/weather';
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

/** 달마다의 낮 최고기온 평년값(℃). 목업이라 한 자리로 굵게 잡는다. */
const MONTH_TEMP_C = [3, 6, 12, 18, 23, 27, 30, 31, 26, 20, 12, 5];

const dayCache = new Map<string, DayWeather>();

/**
 * 하루치 날씨·발전시간. 발전소를 지정하지 않으면 도 전체 기준이다.
 *
 * `forceKind` 를 주면 그 날씨였다면 어땠을지를 낸다 — 종류만 갈아 끼우는 것이 아니라 일사량과
 * 발전시간, 기온·습도까지 그 날씨 기준으로 다시 셈한다. 배경이 비를 그리는데 옆의 발전량은
 * 맑은 날 값이면 화면이 스스로를 부정한다.
 *
 * 실제 연동이 붙으면 이 인자는 쓰이지 않는다. 시연에서 다섯 날씨를 눈으로 견주려고 둔 문이다.
 */
export function getDayWeather(schoolId: string | null, date: Date, forceKind?: WeatherKind): DayWeather {
  const ymd = dayjs(date).format('YYYY-MM-DD');
  const key = `${schoolId ?? 'all'}-${ymd}-${forceKind ?? 'auto'}`;
  const cached = dayCache.get(key);

  if (cached) return cached;

  const school = getSchoolById(schoolId);
  const capacityKw = school ? school.capacityKw : REGION_TOTAL.capacityKw;
  // 날씨는 지역 공통이라 발전소를 가리지 않고 날짜만으로 뽑는다.
  const weatherNext = createRandom(hashSeed(`weather-${ymd}`));
  const month = dayjs(date).month();
  const kind = forceKind ?? pickWeather(weatherNext, month);
  const seasonal = MONTH_FACTOR[month];
  const meta = WEATHER_META[kind];

  const next = createRandom(hashSeed(key));
  const irradianceWm2 = Math.round(980 * seasonal * meta.factor * pickNumber(next, 0.94, 1.06, 3));
  // 맑은 여름날 4.6h 안팎이 되도록 계수를 잡았다.
  const generationHours = Math.round(4.55 * seasonal * meta.factor * pickNumber(next, 0.95, 1.05, 3) * 100) / 100;
  const generationKwh = Math.round(capacityKw * generationHours);

  /*
    기온과 습도.

    달마다의 평년값을 기준으로 두고 날씨가 그것을 밀고 당긴다 — 비·눈이 오는 날은 낮이 서늘하고
    습하며, 맑은 날은 그 반대다. 실제 연동이 붙으면 이 두 줄 대신 기상청 값을 그대로 받는다.
  */
  const baseTemp = MONTH_TEMP_C[month];
  const wet = kind === 'rain' || kind === 'snow';
  const tempC = Math.round(baseTemp + (wet ? -3 : kind === 'clear' ? 2 : 0) + pickNumber(next, -1.5, 1.5, 1));
  const humidity = Math.round(
    (wet ? 82 : kind === 'cloudy' ? 68 : 54) + pickNumber(next, -6, 6, 0),
  );

  const value: DayWeather = {
    date: ymd,
    kind,
    irradianceWm2,
    generationHours,
    generationKwh,
    tempC,
    humidity,
  };

  dayCache.set(key, value);

  return value;
}

/**
 * 오늘부터 이레치 — 교육 화면의 주간 예보 (SFR-006-02).
 *
 * 예보라고 부르지만 목업에서는 같은 시드로 앞날의 날씨를 뽑아 낼 뿐이다. 실제로는 기상청 단기예보를
 * 받아 채우고, 오차는 감수한다 — 걸어 두는 화면에서 「내일 비」 가 틀리는 것보다 아무것도 없는 편이
 * 더 아쉽다는 것이 회의 결론이다 (2026-09-04).
 */
export function getWeekWeather(schoolId: string | null, from: Date): DayWeather[] {
  return Array.from({ length: 7 }, (_, index) => getDayWeather(schoolId, dayjs(from).add(index, 'day').toDate()));
}

/** 한 달치 — 월 달력에 그대로 얹는다. */
export function getMonthDays(schoolId: string | null, year: number, month: number): DayWeather[] {
  const start = dayjs(new Date(year, month, 1));

  return Array.from({ length: start.daysInMonth() }, (_, index) =>
    getDayWeather(schoolId, start.add(index, 'day').toDate()));
}

/** 열두 달치 — 연 달력에 쓴다. */
export function getYearMonths(schoolId: string | null, year: number): MonthPower[] {
  return Array.from({ length: 12 }, (_, month) => {
    const days = getMonthDays(schoolId, year, month);

    return {
      month: `${year}-${String(month + 1).padStart(2, '0')}`,
      generationHours: Math.round(days.reduce((sum, day) => sum + day.generationHours, 0) * 10) / 10,
    };
  });
}
