import dayjs from 'dayjs';
import type { DiagnosisFaultCode } from '@/interface/equipment';
import type { AlarmStatus, AlertRecord, AlertRule } from '@/interface/alert';
import { SCHOOLS } from './schools';
import { isAbnormal } from './status';
import { endOfToday, NOW } from './today';
import { createRandom, hashSeed, pickNumber } from './random';

interface Template {
  faultCode: DiagnosisFaultCode | null;
  status: AlarmStatus;
  title: string;
  description: string;
  device: string;
  /** 조치까지 보통 걸리는 시간(분) */
  typicalMinutes: number;
  /** 조치 완료로 남길 문구. 없으면 기본 문구를 쓴다. */
  actionNote?: string;
}

const TEMPLATES: Template[] = [
  {
    faultCode: 7,
    status: 'commLost',
    title: '인버터 통신 두절',
    description: 'RTU가 인버터 응답을 15분 이상 받지 못했습니다.',
    device: '인버터 #1',
    typicalMinutes: 620,
    actionNote: '현장 통신 모뎀 재기동 후 정상 수집 확인',
  },
  {
    faultCode: 3,
    status: 'fault',
    title: '스트링 출력 저하',
    description: '동일 인버터의 다른 스트링 대비 출력이 30% 이상 낮습니다.',
    device: '인버터 #2 · String 4',
    typicalMinutes: 1450,
    actionNote: '접속함 퓨즈 교체, 스트링 출력 회복 확인',
  },
  {
    faultCode: null,
    status: 'degraded',
    title: '인버터 내부 온도 상승',
    description: '인버터 내부 온도가 65℃를 넘어 출력 제한이 발생했습니다.',
    device: '인버터 #3',
    typicalMinutes: 380,
    actionNote: '냉각 팬 교체 및 통풍구 청소',
  },
  {
    faultCode: 7,
    status: 'fault',
    title: '절연저항 기준치 미달',
    description: '절연저항이 1MΩ 아래로 측정되었습니다. 감전 위험이 있어 즉시 확인이 필요합니다.',
    device: '접속함 A',
    typicalMinutes: 240,
    actionNote: '접속함 침수 배수, 절연저항 재측정 정상',
  },
  {
    faultCode: 3,
    status: 'degraded',
    title: '어레이 출력 이상 저하',
    description: '맑은 날 오후 시간대 출력이 반복적으로 떨어집니다. 오염 또는 음영이 의심됩니다.',
    device: '모듈 어레이 B동',
    typicalMinutes: 2900,
    actionNote: '모듈 표면 세척 및 남측 수목 가지치기',
  },
  {
    faultCode: 5,
    status: 'degraded',
    title: '일사량계 계측 오차 확대',
    description: '인근 관측소 값과의 차이가 허용 오차 상한에 근접했습니다.',
    device: '일사량계',
    typicalMinutes: 4200,
    actionNote: '일사량계 돔 청소 후 영점 재설정',
  },
  {
    faultCode: null,
    status: 'degraded',
    title: '일 발전량 기대치 미달',
    description: '같은 일사량 대비 발전량이 기대치의 80%에 못 미쳤습니다.',
    device: '발전소 전체',
    typicalMinutes: 900,
  },
  {
    faultCode: null,
    status: 'commLost',
    title: '수집 지연',
    description: '계측값이 예정 시각보다 30분 이상 늦게 들어왔습니다.',
    device: 'RTU',
    typicalMinutes: 60,
  },
];

const HANDLERS = ['시설과 담당자', '학교 시설 담당', '위탁 관리업체', '유지보수 협력사'];

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
      status: template.status,
      faultCode: template.faultCode,
      title: template.title,
      description: template.description,
      occurredAt: occurred.format('YYYY-MM-DD HH:mm'),
      resolvedAt: resolved && resolved.isBefore(base) ? resolved.format('YYYY-MM-DD HH:mm') : null,
      handled: Boolean(resolved && resolved.isBefore(base)),
      manual,
      handler: manual ? HANDLERS[Math.floor(next() * HANDLERS.length) % HANDLERS.length] : handled ? '자동 복구' : null,
      actionNote: handled ? (template.actionNote ?? DEFAULT_ACTION) : null,
    });
  }

  return [...records, ...buildOpenAlerts(next)]
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
}

/** 지금 이상 상태인 발전소에 붙일 템플릿. 상태와 경보의 무게를 맞춘다. */
const OPEN_TEMPLATE: Partial<Record<AlarmStatus, Template>> = {
  fault: TEMPLATES[3],
  degraded: TEMPLATES[4],
  commLost: TEMPLATES[0],
};

/**
 * 지금 아픈 발전소마다 아직 열려 있는 경보를 하나씩 세운다.
 *
 * 위의 무작위 생성만으로는 "상태는 경고인데 열린 경보는 없는" 상황이 나온다.
 * 상황판에서 지도·장애 목록과 알림창이 서로 다른 말을 하게 되므로, 이상 상태와
 * 미조치 경보를 짝지어 둔다. 하루가 끝나는 시각이 아니라 지금 시각에서 거슬러 올라가야
 * "몇 시간 전에 벌어진 일" 로 읽힌다.
 */
function buildOpenAlerts(next: () => number): AlertRecord[] {
  return SCHOOLS.filter((school) => isAbnormal(school.status)).map((school, index) => {
    // isAbnormal 이 걸러 준 뒤라 school.status 는 알림이 될 수 있는 셋 중 하나다.
    const template = OPEN_TEMPLATE[school.status as AlarmStatus] ?? TEMPLATES[6];
    const occurred = NOW.subtract(Math.floor(pickNumber(next, 0, 9)), 'hour')
      .subtract(Math.floor(pickNumber(next, 0, 59)), 'minute');

    return {
      id: `AL-OPEN-${String(index + 1).padStart(3, '0')}`,
      schoolId: school.id,
      schoolName: school.name,
      regionName: school.regionName,
      deviceName: template.device,
      status: template.status,
      faultCode: template.faultCode,
      title: template.title,
      description: template.description,
      occurredAt: occurred.format('YYYY-MM-DD HH:mm'),
      resolvedAt: null,
      handled: false,
      manual: false,
      handler: null,
      actionNote: null,
    };
  });
}

export const ALERT_RECORDS: AlertRecord[] = buildAlerts();

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
    description: 'RTU가 인버터 응답을 받지 못한 상태가 이어질 때',
    status: 'commLost',
    threshold: '15분 이상',
    enabled: true,
    channels: ['시스템', '문자', '메일'],
  },
  {
    id: 'RULE-02',
    label: '스트링 출력 저하',
    description: '같은 인버터의 다른 스트링 대비 출력이 낮을 때',
    status: 'fault',
    threshold: '30% 이상 · 2일 연속',
    enabled: true,
    channels: ['시스템', '문자'],
  },
  {
    id: 'RULE-03',
    label: '인버터 과열',
    description: '인버터 내부 온도가 기준을 넘을 때',
    status: 'degraded',
    threshold: '65℃ 초과',
    enabled: true,
    channels: ['시스템', '메일'],
  },
  {
    id: 'RULE-04',
    label: '발전량 기대치 미달',
    description: '일사량 대비 발전량이 기대치에 못 미칠 때',
    status: 'degraded',
    threshold: '기대치의 80% 미만',
    enabled: true,
    channels: ['시스템'],
  },
  {
    id: 'RULE-05',
    label: '수집 지연',
    description: '계측값이 예정 시각보다 늦게 들어올 때',
    status: 'commLost',
    threshold: '30분 이상',
    enabled: false,
    channels: ['시스템'],
  },
  {
    id: 'RULE-06',
    label: '일사량계 오차',
    description: '인근 관측소 값과 차이가 커질 때',
    status: 'degraded',
    threshold: '오차 2.5% 초과',
    enabled: true,
    channels: ['시스템'],
  },
];
