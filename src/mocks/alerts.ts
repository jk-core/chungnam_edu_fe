import dayjs from 'dayjs';
import type { AlertRecord, AlertRule, AlertType } from '@/interface/alert';
import type { Severity } from '@/interface/energy';
import { SCHOOLS } from './schools';
import { endOfToday } from './today';
import { createRandom, hashSeed, pickNumber } from './random';

interface Template {
  faultCode: string | null;
  type: AlertType;
  severity: Severity;
  title: string;
  description: string;
  device: string;
  /** 조치까지 보통 걸리는 시간(분) */
  typicalMinutes: number;
}

const TEMPLATES: Template[] = [
  {
    faultCode: 'F-401',
    type: '통신',
    severity: 'critical',
    title: '인버터 통신 두절',
    description: '수집장치가 인버터 응답을 15분 이상 받지 못했습니다.',
    device: '인버터 #1',
    typicalMinutes: 620,
  },
  {
    faultCode: 'F-104',
    type: '발전',
    severity: 'critical',
    title: '스트링 출력 저하',
    description: '동일 인버터의 다른 스트링 대비 출력이 30% 이상 낮습니다.',
    device: '인버터 #2 · String 4',
    typicalMinutes: 1450,
  },
  {
    faultCode: 'F-201',
    type: '설비',
    severity: 'caution',
    title: '인버터 내부 온도 상승',
    description: '인버터 내부 온도가 65℃를 넘어 출력 제한이 발생했습니다.',
    device: '인버터 #3',
    typicalMinutes: 380,
  },
  {
    faultCode: 'F-202',
    type: '설비',
    severity: 'critical',
    title: '절연저항 기준치 미달',
    description: '절연저항이 1MΩ 아래로 측정되었습니다. 감전 위험이 있어 즉시 확인이 필요합니다.',
    device: '접속함 A',
    typicalMinutes: 240,
  },
  {
    faultCode: 'F-102',
    type: '환경',
    severity: 'caution',
    title: '어레이 출력 이상 저하',
    description: '맑은 날 오후 시간대 출력이 반복적으로 떨어집니다. 오염 또는 음영이 의심됩니다.',
    device: '모듈 어레이 B동',
    typicalMinutes: 2900,
  },
  {
    faultCode: 'F-301',
    type: '환경',
    severity: 'info',
    title: '일사량계 계측 오차 확대',
    description: '인근 관측소 값과의 차이가 허용 오차 상한에 근접했습니다.',
    device: '일사량계',
    typicalMinutes: 4200,
  },
  {
    faultCode: null,
    type: '발전',
    severity: 'caution',
    title: '일 발전량 기대치 미달',
    description: '같은 일사량 대비 발전량이 기대치의 80%에 못 미쳤습니다.',
    device: '발전소 전체',
    typicalMinutes: 900,
  },
  {
    faultCode: null,
    type: '통신',
    severity: 'info',
    title: '수집 지연',
    description: '계측값이 예정 시각보다 30분 이상 늦게 들어왔습니다.',
    device: '수집장치',
    typicalMinutes: 60,
  },
];

const HANDLERS = ['시설과 담당자', '학교 시설 담당', '위탁 관리업체', '유지보수 협력사'];

const ACTION_NOTES: Record<string, string> = {
  'F-401': '현장 통신 모뎀 재기동 후 정상 수집 확인',
  'F-104': '접속함 퓨즈 교체, 스트링 출력 회복 확인',
  'F-201': '냉각 팬 교체 및 통풍구 청소',
  'F-202': '접속함 침수 배수, 절연저항 재측정 정상',
  'F-102': '모듈 표면 세척 및 남측 수목 가지치기',
  'F-301': '일사량계 돔 청소 후 영점 재설정',
};

const DEFAULT_ACTION = '현장 점검 결과 이상 없음. 계측값 정상 범위 복귀 확인';

function buildAlerts(): AlertRecord[] {
  const next = createRandom(hashSeed('cne-alerts-2026'));
  // 오늘을 기준으로 최근 60일 사이에 흩뿌린다.
  const base = endOfToday();
  const records: AlertRecord[] = [];

  for (let index = 0; index < 64; index += 1) {
    const template = TEMPLATES[index % TEMPLATES.length];
    const school = SCHOOLS[Math.floor(next() * SCHOOLS.length) % SCHOOLS.length];
    const occurred = base
      .subtract(Math.floor(pickNumber(next, 0, 59)), 'day')
      .hour(Math.floor(pickNumber(next, 4, 20)))
      .minute(Math.floor(pickNumber(next, 0, 59)));

    const ageHours = base.diff(occurred, 'hour');
    // 오래된 건일수록 이미 조치되어 있다.
    const handled = ageHours > 72 ? next() > 0.08 : next() > 0.55;
    const manual = handled && template.faultCode !== null && next() > 0.28;
    const durationMinutes = Math.round(template.typicalMinutes * pickNumber(next, 0.4, 1.6, 2));
    const resolved = handled ? occurred.add(durationMinutes, 'minute') : null;

    records.push({
      id: `AL-${occurred.format('YYMMDD')}-${String(index + 1).padStart(3, '0')}`,
      schoolId: school.id,
      schoolName: school.name,
      regionName: school.regionName,
      deviceName: template.device,
      type: template.type,
      severity: template.severity,
      faultCode: template.faultCode,
      title: template.title,
      description: template.description,
      occurredAt: occurred.format('YYYY-MM-DD HH:mm'),
      resolvedAt: resolved && resolved.isBefore(base) ? resolved.format('YYYY-MM-DD HH:mm') : null,
      handled: Boolean(resolved && resolved.isBefore(base)),
      manual,
      handler: manual ? HANDLERS[Math.floor(next() * HANDLERS.length) % HANDLERS.length] : handled ? '자동 복구' : null,
      actionNote: handled ? (template.faultCode ? ACTION_NOTES[template.faultCode] : DEFAULT_ACTION) : null,
    });
  }

  return records.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
}

export const ALERT_RECORDS: AlertRecord[] = buildAlerts();

export const ALERT_TYPES: AlertType[] = ['통신', '발전', '설비', '환경'];

/** 알림이 열려 있던 시간(분). 아직 진행 중이면 기준 시각까지로 센다. */
export function alertDurationMinutes(alert: AlertRecord, now = endOfToday()): number {
  const end = alert.resolvedAt ? dayjs(alert.resolvedAt) : now;

  return Math.max(0, end.diff(dayjs(alert.occurredAt), 'minute'));
}

/** 홈 화면에 띄우는 최근 알림 — 미조치 건을 먼저 보여 준다. */
export const RECENT_ALERTS = [...ALERT_RECORDS]
  .sort((a, b) => Number(a.handled) - Number(b.handled) || (a.occurredAt < b.occurredAt ? 1 : -1))
  .slice(0, 5);

export const ALERT_RULES: AlertRule[] = [
  {
    id: 'RULE-01',
    label: '통신 두절',
    description: '수집장치가 인버터 응답을 받지 못한 상태가 이어질 때',
    type: '통신',
    severity: 'critical',
    threshold: '15분 이상',
    enabled: true,
    channels: ['시스템', '문자', '메일'],
  },
  {
    id: 'RULE-02',
    label: '스트링 출력 저하',
    description: '같은 인버터의 다른 스트링 대비 출력이 낮을 때',
    type: '발전',
    severity: 'critical',
    threshold: '30% 이상 · 2일 연속',
    enabled: true,
    channels: ['시스템', '문자'],
  },
  {
    id: 'RULE-03',
    label: '인버터 과열',
    description: '인버터 내부 온도가 기준을 넘을 때',
    type: '설비',
    severity: 'caution',
    threshold: '65℃ 초과',
    enabled: true,
    channels: ['시스템', '메일'],
  },
  {
    id: 'RULE-04',
    label: '발전량 기대치 미달',
    description: '일사량 대비 발전량이 기대치에 못 미칠 때',
    type: '발전',
    severity: 'caution',
    threshold: '기대치의 80% 미만',
    enabled: true,
    channels: ['시스템'],
  },
  {
    id: 'RULE-05',
    label: '수집 지연',
    description: '계측값이 예정 시각보다 늦게 들어올 때',
    type: '통신',
    severity: 'info',
    threshold: '30분 이상',
    enabled: false,
    channels: ['시스템'],
  },
  {
    id: 'RULE-06',
    label: '일사량계 오차',
    description: '인근 관측소 값과 차이가 커질 때',
    type: '환경',
    severity: 'info',
    threshold: '오차 2.5% 초과',
    enabled: true,
    channels: ['시스템'],
  },
];
