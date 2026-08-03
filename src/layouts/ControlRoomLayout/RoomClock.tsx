import { useEffect, useState } from 'react';
import styles from './ControlRoomLayout.module.scss';

/**
 * 관제실 벽시계라 표준시를 한국으로 못 박는다.
 * 상황판을 어느 지역 PC 에 띄우든 같은 시각을 가리켜야 한다.
 */
const TIME_ZONE = 'Asia/Seoul';

const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const dateFormat = new Intl.DateTimeFormat('ko-KR', { timeZone: TIME_ZONE, dateStyle: 'long' });

const weekdayFormat = new Intl.DateTimeFormat('ko-KR', { timeZone: TIME_ZONE, weekday: 'short' });

/**
 * 벽시계 — 목업 기준일이 아니라 실제 한국 시각을 가리킨다.
 * 1초 틱을 이 컴포넌트 안에 가둔다. 상위에 두면 매초 상황판 전체가 다시 그려진다.
 */
export function RoomClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // setInterval 이라 문서가 가려져도 계속 돈다.
    const timer = window.setInterval(() => setNow(new Date()), 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <span>
      <span className={styles.bar__clock}>{timeFormat.format(now)}</span>
      <span className={styles.bar__date}>
        {dateFormat.format(now)} ({weekdayFormat.format(now)})
      </span>
    </span>
  );
}
