export type WeatherKind = 'clear' | 'partlyCloudy' | 'cloudy' | 'rain' | 'snow';

/** 달력 한 칸에 얹는 하루치 값 (SFR-007-01/02) */
export interface DayWeather {
  /** YYYY-MM-DD */
  date: string;
  kind: WeatherKind;
  /** 그 날 최대 일사량 (W/m², 0~2000) */
  irradianceWm2: number;
  /** 등가 발전시간(h) = 발전량 / 설비용량 */
  generationHours: number;
  generationKwh: number;
  /** 자가소비로 덜 낸 전기요금(원) */
  savingWon: number;
}

/** 월 단위로 접은 값 — 연 달력 한 칸에 쓴다 */
export interface MonthWeather {
  /** YYYY-MM */
  month: string;
  generationHours: number;
  generationKwh: number;
  savingWon: number;
  /** 그 달에 가장 많았던 날씨 */
  kind: WeatherKind;
}
