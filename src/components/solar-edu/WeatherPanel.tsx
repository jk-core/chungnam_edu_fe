import dayjs from 'dayjs';
import { cn } from '@/utils/cn';
import { WEATHER_META } from '@/mocks/weather';
import { WeatherIcon } from '@/components/common/DataCalendar/WeatherIcon';
import type { DayWeather } from '@/interface/weather';
import styles from './WeatherPanel.module.scss';

const DAY_NAME = ['일', '월', '화', '수', '목', '금', '토'];

interface WeatherPanelProps {
  today: DayWeather;
  /** 오늘부터 이레치. 첫 칸은 오늘이다 */
  forecast: DayWeather[];
  /** 세로로 긴 자리에 세울 때 켠다. 기본은 눕힌 띠 */
  stacked?: boolean;
}

/**
 * 오늘 날씨와 주간 예보 (SFR-006-02).
 *
 * 걸어 두는 화면의 값어치는 실시간성이다 — 비 오는 날 화면에 해가 떠 있으면 옆의 발전량까지
 * 믿지 않게 된다. 배경이 이미 날씨를 그리고 있으므로 이 칸이 하는 일은 **수치로 못 박는 것**이다.
 *
 * 학교가 기상에 관심이 높은 까닭은 소풍·운동회 때문이고, 발전량이 낮은 날의 이유를 학생에게
 * 설명하는 몫도 여기가 한다 — 「오늘은 흐려서 적게 만들었다」 가 한 줄로 이어진다 (2026-09-04 회의).
 */
export function WeatherPanel({ today, forecast, stacked }: WeatherPanelProps) {
  return (
    <section
      className={cn(styles.weather, { [styles['weather--stacked']]: stacked })}
      aria-label="오늘 날씨와 주간 예보"
    >
      <p className={styles.now}>
        <span className={styles.now__icon}>
          <WeatherIcon kind={today.kind} size={stacked ? 40 : 52} />
        </span>

        <span className={styles.now__text}>
          <strong className={styles.now__label}>{WEATHER_META[today.kind].label}</strong>
          <span className={styles.now__figures}>
            <span className={styles.now__temp}>{today.tempC}℃</span>
            <span className={styles.now__humid}>습도 {today.humidity}%</span>
          </span>
        </span>
      </p>

      {/*
        이레치 예보.

        오늘을 첫 칸에 두고 이름을 「오늘」 로 바꿔 단다 — 요일만 적어 두면 어디가 오늘인지 세어야
        하는데, 걸어 두는 화면 앞에서는 아무도 세지 않는다.
      */}
      <ol className={styles.week}>
        {forecast.map((day, index) => (
          <li key={day.date} className={cn(styles.day, { [styles['day--today']]: index === 0 })}>
            <span className={styles.day__name}>
              {index === 0 ? '오늘' : DAY_NAME[dayjs(day.date).day()]}
            </span>
            <WeatherIcon kind={day.kind} size={24} />
            <span className={styles.day__temp}>{day.tempC}°</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
