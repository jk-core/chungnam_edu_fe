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
  /**
   * 낮 최고기온(℃)과 상대습도(%).
   *
   * 교육 화면이 「오늘 날씨」 를 말하려면 그림만으로는 모자라 수치가 있어야 한다 (2026-09-04 회의).
   * 학교는 소풍·운동회 때문에 기상 관심도가 높고, 발전량이 낮은 날의 까닭을 설명하는 몫도 한다.
   */
  tempC: number;
  humidity: number;
}

/** 월 단위로 접은 값 — 연 달력 한 칸에 쓴다. 월·연 칸은 날씨를 얹지 않는다 */
export interface MonthPower {
  /** YYYY-MM */
  month: string;
  generationHours: number;
}
