import type { AccessLog, LoginTrendPoint, MenuUsage, SecurityEvent } from '@/interface/security';
import { NAVIGATION } from '@/configs/navigation';
import { createRandom, hashSeed, pickNumber, pickOne } from './random';
import { stampAgo, TODAY } from './today';

const ACTORS = [
  { id: 'cne-admin', name: '김도현' },
  { id: 'cne-office', name: '박세연' },
  { id: 'school-cheonan', name: '이준서' },
  { id: 'school-asan', name: '정가은' },
  { id: 'school-seosan', name: '한지호' },
];

const ACTIONS: AccessLog['action'][] = ['조회', '조회', '조회', '내려받기', '수정', '로그인'];

/** GNB 소메뉴를 그대로 활용 통계의 행으로 쓴다 (SFR-028). */
const MENUS = NAVIGATION.filter((section) => section.children.length > 0)
  .flatMap((section) => section.children.map((child) => ({ section: section.label, menu: child.label })));

function buildAccessLogs(): AccessLog[] {
  const next = createRandom(hashSeed('cne-access-2026'));

  return Array.from({ length: 60 }, (_, index) => {
    const actor = pickOne(next, ACTORS);
    const dayOffset = Math.floor(index / 9);

    return {
      id: `AL-${String(9000 - index)}`,
      at: stampAgo(
        dayOffset,
        `${String(Math.round(pickNumber(next, 8, 18))).padStart(2, '0')}:${String(Math.round(pickNumber(next, 0, 59))).padStart(2, '0')}`,
      ),
      userId: actor.id,
      userName: actor.name,
      ip: `10.20.${Math.round(pickNumber(next, 1, 40))}.${Math.round(pickNumber(next, 2, 250))}`,
      menu: pickOne(next, MENUS).menu,
      action: pickOne(next, ACTIONS),
    };
  }).sort((a, b) => b.at.localeCompare(a.at));
}

export const ACCESS_LOGS: AccessLog[] = buildAccessLogs();

export const SECURITY_EVENTS: SecurityEvent[] = [
  {
    id: 'SE-104',
    at: stampAgo(0, '09:12'),
    severity: 'caution',
    title: '동일 계정 로그인 실패 4회',
    detail: 'school-asan 계정이 4회 연속 실패했습니다. 1회 더 실패하면 잠깁니다.',
    handled: false,
  },
  {
    id: 'SE-103',
    at: stampAgo(2, '22:47'),
    severity: 'critical',
    title: '업무 시간 외 관리자 접속',
    detail: 'cne-admin 계정이 내부망 밖 대역(10.99.x.x)에서 접속을 시도해 차단했습니다.',
    handled: true,
  },
  {
    id: 'SE-102',
    at: stampAgo(5, '14:03'),
    severity: 'info',
    title: '비밀번호 만료 예정 계정 3건',
    detail: '90일 주기가 7일 안에 도래하는 계정에 변경 안내를 보냈습니다.',
    handled: true,
  },
  {
    id: 'SE-101',
    at: stampAgo(9, '11:31'),
    severity: 'caution',
    title: '대량 내려받기 감지',
    detail: 'cne-office 계정이 10분 안에 원시 데이터를 12회 내려받았습니다. 업무 목적 확인이 필요합니다.',
    handled: true,
  },
];

/** 메뉴별 활용 통계 (SFR-028) — 최근 30일 기준. */
export function getMenuUsage(): MenuUsage[] {
  const next = createRandom(hashSeed('cne-usage-2026'));

  return MENUS.map(({ section, menu }) => {
    // 홈·발전통계처럼 앞쪽 메뉴가 많이 쓰이는 모양을 만든다.
    const weight = section === '홈' ? 4 : section === '발전통계' ? 3 : section === 'AI진단' ? 2.2 : 1.6;

    return {
      section,
      menu,
      views: Math.round(pickNumber(next, 80, 420) * weight),
      users: Math.round(pickNumber(next, 8, 40) * Math.min(weight, 2)),
    };
  }).sort((a, b) => b.views - a.views);
}

/** 일별 로그인 성공·실패 추이 — 보안 관제와 활용 통계가 같이 쓴다. */
export function getLoginTrend(days: number): LoginTrendPoint[] {
  const next = createRandom(hashSeed(`cne-login-trend-${days}`));

  return Array.from({ length: days }, (_, index) => {
    const date = TODAY.subtract(days - 1 - index, 'day');
    const weekend = date.day() === 0 || date.day() === 6;

    return {
      date: date.format('YYYY-MM-DD'),
      success: Math.round(pickNumber(next, weekend ? 4 : 26, weekend ? 12 : 74)),
      fail: Math.round(pickNumber(next, 0, weekend ? 2 : 7)),
    };
  });
}
