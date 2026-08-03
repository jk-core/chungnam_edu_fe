import type { IntegrationLog, IntegrationSummary } from '@/interface/integration';
import { SCHOOLS } from './schools';
import { createRandom, hashSeed, pickNumber, pickOne } from './random';
import { TODAY } from './today';

const TARGET = '교육부 REMS';

const PAYLOADS = [
  { name: '일 발전량', rows: SCHOOLS.length },
  { name: '시간대별 발전량', rows: SCHOOLS.length * 24 },
  { name: '설비 현황', rows: SCHOOLS.length },
  { name: '고장·알림 현황', rows: 40 },
];

const FAIL_REASONS = [
  '응답 지연(타임아웃 30초 초과)',
  '인증 토큰 만료',
  '수신측 점검 시간(503)',
  '전문 형식 검증 실패(필드 누락)',
];

function buildLogs(): IntegrationLog[] {
  const next = createRandom(hashSeed('cne-integration-2026'));
  const rows: IntegrationLog[] = [];
  let sequence = 0;

  // 최근 30일, 하루 4회(전문 종류별 1회) 전송한다.
  for (let day = 29; day >= 0; day -= 1) {
    const date = TODAY.subtract(day, 'day');

    PAYLOADS.forEach((payload, payloadIndex) => {
      sequence += 1;
      const roll = next();
      // 실패의 절반쯤은 자동 재시도로 회복된 상태로 둔다.
      const result = roll > 0.94 ? 'fail' : roll > 0.88 ? 'retried' : 'success';
      const failed = result === 'fail';

      rows.push({
        id: `IT-${String(sequence).padStart(4, '0')}`,
        at: date.hour(5 + payloadIndex * 5).minute(Math.round(pickNumber(next, 0, 40))).format('YYYY-MM-DD HH:mm'),
        target: TARGET,
        payload: payload.name,
        rowCount: payload.rows,
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
