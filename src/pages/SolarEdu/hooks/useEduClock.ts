import { useEffect, useState } from 'react';

const TIME_ZONE = 'Asia/Seoul';

/** 벽시계와 어긋나지 않을 만큼만 자주 다시 읽는다 */
const TICK_MS = 30_000;

const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const dateFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: TIME_ZONE,
  month: 'long',
  day: 'numeric',
  weekday: 'short',
});

const hourFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * 한국 시각을 소수 시간으로 바꾼다 (14시 15분 → 14.25).
 * 화면의 "지금" 표시가 벽시계를 따라가려면 이 값이 있어야 한다 — 보는 사람이 어느 시간대에
 * 있든 한국 기준이어야 하므로 `getHours()` 대신 서식기로 뽑는다.
 */
function kstHourOf(date: Date): number {
  const parts = hourFormat.formatToParts(date);
  const read = (type: 'hour' | 'minute') => Number(parts.find((part) => part.type === type)?.value ?? 0);

  return read('hour') + read('minute') / 60;
}

/** 시계, 날짜, 그리고 "지금"을 가리키는 소수 시간. 셋이 같은 순간을 본다. */
export function useEduClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  return { clock: timeFormat.format(now), date: dateFormat.format(now), nowHour: kstHourOf(now) };
}
