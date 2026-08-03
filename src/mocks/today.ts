import dayjs from 'dayjs';

/**
 * 목업이 기준으로 삼는 "오늘".
 *
 * 시드 난수로 만든 데이터와 날짜가 어긋나지 않으려면 기준일이 한 곳에 고정돼야 한다.
 * 실시간 dayjs() 를 쓰면 하루가 넘어갈 때마다 알림·점검 이력이 미래로 밀린다.
 * 실제 API 로 넘어갈 때는 이 파일만 서버 시각으로 바꾸면 된다.
 */
export const TODAY = dayjs('2026-07-30');

/**
 * 목업 기준 "지금" 시각.
 * 실시간 출력·최근 수집 시각처럼 시각이 필요한 화면이 같은 값을 보게 고정한다.
 */
export const NOW_HOUR = 14.25;

export const NOW = TODAY.add(NOW_HOUR * 60, 'minute');

export const todayDate = () => TODAY.toDate();

/** 하루의 끝 — 경과 시간 계산의 기준점 */
export const endOfToday = () => TODAY.endOf('day');

/** n일 전 날짜 문자열 (YYYY-MM-DD) */
export const daysAgo = (days: number) => TODAY.subtract(days, 'day').format('YYYY-MM-DD');

/** n일 뒤 날짜 문자열 (YYYY-MM-DD) */
export const daysAhead = (days: number) => TODAY.add(days, 'day').format('YYYY-MM-DD');

/** n일 전 시각 문자열 (YYYY-MM-DD HH:mm) */
export const stampAgo = (days: number, time: string) => `${daysAgo(days)} ${time}`;
