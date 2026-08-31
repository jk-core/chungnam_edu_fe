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
      <span className={styles.bar__clock}>
        {/*
          자릿수를 한 칸씩 끊어 세운다.

          글꼴에 따라 숫자 폭이 고르지 않아(Orbitron 은 `1` 과 `0` 이 두 배 넘게 차이 난다)
          매초 시각이 바뀔 때마다 시계가 옆으로 흔들리고 그 옆 단추까지 밀린다. 자릿수마다
          같은 폭의 칸을 주고 가운데 세우면, 어떤 글꼴을 얹어도 폭이 움직이지 않는다.
          콜론은 좁은 글자라 칸을 주지 않는다 — 넣으면 시:분:초 사이가 벌어져 읽기 나쁘다.
        */}
        {[...timeFormat.format(now)].map((char, index) => (
          <span
            key={`${index}-${char}`}
            className={char === ':' ? undefined : styles.bar__digit}
          >
            {char}
          </span>
        ))}
      </span>
      <span className={styles.bar__date}>
        {dateFormat.format(now)} ({weekdayFormat.format(now)})
      </span>
    </span>
  );
}
