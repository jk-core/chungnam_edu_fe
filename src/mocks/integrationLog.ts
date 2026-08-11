import type { IntegrationLog, IntegrationSummary } from '@/interface/integration';
import { SCHOOLS } from './schools';
import { createRandom, hashSeed, pickNumber, pickOne } from './random';
import { TODAY } from './today';

const TARGET = '교육부 REMS';

/*
  전송은 가공하지 않은 수집 데이터(raw)를 그대로 넘긴다 — 전문 종류를 나누지 않는다.
  하루 네 번, 직전 6시간치를 모아 보낸다.
*/
const SEND_HOURS = [0, 6, 12, 18];

const FAIL_REASONS = [
  '응답 지연(타임아웃 30초 초과)',
  '인증 토큰 만료',
  '수신측 점검 시간(503)',
  '데이터 형식 검증 실패(필드 누락)',
];

function buildLogs(): IntegrationLog[] {
  const next = createRandom(hashSeed('cne-integration-2026'));
  const rows: IntegrationLog[] = [];
  let sequence = 0;

  // 최근 30일, 하루 4회 전송한다.
  for (let day = 29; day >= 0; day -= 1) {
    const date = TODAY.subtract(day, 'day');

    SEND_HOURS.forEach((hour) => {
      sequence += 1;
      const roll = next();
      // 실패의 절반쯤은 자동 재시도로 회복된 상태로 둔다.
      const result = roll > 0.94 ? 'fail' : roll > 0.88 ? 'retried' : 'success';
      const failed = result === 'fail';

      rows.push({
        id: `IT-${String(sequence).padStart(4, '0')}`,
        at: date.hour(hour).minute(Math.round(pickNumber(next, 0, 40))).format('YYYY-MM-DD HH:mm'),
        target: TARGET,
        // 6시간치 15분 주기 계측을 발전소 수만큼 모은다.
        rowCount: SCHOOLS.length * 24 + Math.round(pickNumber(next, -120, 120)),
        result,
        responseCode: failed ? pickOne(next, [408, 401, 503, 422]) : 200,
        latencyMs: Math.round(pickNumber(next, failed ? 4000 : 180, failed ? 30000 : 1400)),
        failReason: failed ? pickOne(next, FAIL_REASONS) : null,
      });
    });
  }

  return rows.reverse();
}

export const INTEGRATION_LOGS: IntegrationLog[] = buildLogs();

/**
 * 일자별 전송 성공률 추이 (SFR-027-06).
 * 요약 카드만으로는 어느 날부터 나빠졌는지 알 수 없어 시계열로도 편다.
 */
export function integrationTrend(logs: IntegrationLog[], days = 30): { date: string; total: number; success: number; rate: number }[] {
  return Array.from({ length: days }, (_, index) => {
    const date = TODAY.subtract(days - 1 - index, 'day').format('YYYY-MM-DD');
    // at 은 'YYYY-MM-DD HH:mm' 이라 날짜 부분만 떼어 견준다.
    const rows = logs.filter((log) => log.at.slice(0, 10) === date);
    const success = rows.filter((log) => log.result !== 'fail').length;

    return { date, total: rows.length, success, rate: rows.length > 0 ? success / rows.length : 1 };
  });
}

/** 일·주·월 성공률 (SFR-027-06). 재송신으로 회복된 건도 성공으로 센다. */
export function integrationSummaries(logs: IntegrationLog[]): IntegrationSummary[] {
  const spans = [
    { label: '오늘', days: 1 },
    { label: '최근 7일', days: 7 },
    { label: '최근 30일', days: 30 },
  ];

  return spans.map(({ label, days }) => {
    const from = TODAY.subtract(days - 1, 'day').format('YYYY-MM-DD');
    const rows = logs.filter((log) => log.at >= from);
    const success = rows.filter((log) => log.result !== 'fail').length;

    return { label, total: rows.length, success, rate: rows.length > 0 ? success / rows.length : 0 };
  });
}
