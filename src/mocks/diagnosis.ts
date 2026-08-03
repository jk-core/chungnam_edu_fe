import type { Inspection, Issue, School, Severity } from '@/interface/energy';
import type { OperationStatus } from '@/interface/status';
import { SCHOOLS } from './schools';
import { daysAgo, daysAhead, stampAgo } from './today';

/** 종합 진단 점수(0~100)와 구성 지표 */
export const HEALTH = {
  score: 87,
  previousScore: 84,
  factors: [
    { label: '발전 효율', value: 0.92, note: '기대 발전량 대비 실측' },
    { label: '설비 가동률', value: 0.96, note: '통신 정상 인버터 비율' },
    { label: '이상 대응', value: 0.78, note: '검출 후 7일 내 조치 비율' },
    { label: '점검 이행', value: 0.83, note: '정기점검 일정 준수율' },
  ],
};

// 이상 항목은 실제 학교 목록에 붙인다. 발전소를 선택하면 그 학교 것만 걸러 내기 위함이다.
const ISSUE_TARGETS = [3, 17, 31, 46, 63, 82].map((index) => SCHOOLS[index % SCHOOLS.length]);

interface IssueSeed {
  id: string;
  device: string;
  category: string;
  severity: Severity;
  detectedAt: string;
  lossKwh: number;
  summary: string;
  action: string;
  trend: number[];
}

const ISSUE_SEEDS: IssueSeed[] = [
  {
    id: 'ISS-2607-018',
    device: '인버터 #2 · String 4',
    category: '스트링 출력 저하',
    severity: 'critical',
    detectedAt: stampAgo(3, '09:14'),
    lossKwh: 42.6,
    summary: '동일 인버터의 다른 스트링 대비 출력이 34% 낮은 상태가 나흘째 이어지고 있습니다.',
    action: '스트링 4번 접속함 퓨즈와 커넥터 접촉 상태를 점검하세요.',
    trend: [98, 96, 91, 78, 71, 68, 66],
  },
  {
    id: 'ISS-2607-017',
    device: '인버터 #1',
    category: '통신 두절',
    severity: 'critical',
    detectedAt: stampAgo(3, '04:02'),
    lossKwh: 128.4,
    summary: '새벽 4시 이후 데이터 수집이 중단되어 발전 여부를 확인할 수 없습니다.',
    action: '현장 통신 모뎀 전원과 LTE 신호 세기를 확인하세요.',
    trend: [100, 99, 100, 98, 100, 61, 0],
  },
  {
    id: 'ISS-2607-016',
    device: '모듈 어레이 B동',
    category: '오염·음영',
    severity: 'caution',
    detectedAt: stampAgo(4, '15:40'),
    lossKwh: 18.2,
    summary: '오후 3시 이후 특정 구간 출력이 반복적으로 떨어집니다. 인접 수목 성장에 따른 음영으로 추정됩니다.',
    action: '어레이 남서측 수목 가지치기와 모듈 표면 세척을 검토하세요.',
    trend: [94, 93, 90, 89, 87, 86, 85],
  },
  {
    id: 'ISS-2607-015',
    device: '인버터 #3',
    category: '과열',
    severity: 'caution',
    detectedAt: stampAgo(4, '13:22'),
    lossKwh: 11.7,
    summary: '인버터 내부 온도가 사흘 연속 65℃를 넘었습니다. 출력 제한이 간헐적으로 발생합니다.',
    action: '냉각 팬 동작과 통풍구 이물질을 점검하세요.',
    trend: [58, 61, 63, 66, 67, 68, 69],
  },
  {
    id: 'ISS-2607-014',
    device: '일사량계',
    category: '계측값 불일치',
    severity: 'info',
    detectedAt: stampAgo(5, '10:05'),
    lossKwh: 0,
    summary: '일사량계 측정값과 인근 관측소 값의 차이가 2.4%로, 허용 오차 상한에 근접했습니다.',
    action: '다음 정기점검 시 일사량계 센서 보정을 함께 진행하세요.',
    trend: [1.1, 1.3, 1.6, 1.8, 2.0, 2.2, 2.4],
  },
  {
    id: 'ISS-2607-013',
    device: '인버터 #1 · String 2',
    category: '스트링 출력 저하',
    severity: 'caution',
    detectedAt: stampAgo(6, '11:48'),
    lossKwh: 9.4,
    summary: '맑은 날에도 스트링 2번의 출력이 기준 대비 12% 낮게 유지되고 있습니다.',
    action: '모듈 개별 전압을 측정해 열화 모듈을 특정하세요.',
    trend: [97, 95, 94, 92, 90, 89, 88],
  },
];

export const ISSUES: Issue[] = ISSUE_SEEDS.map((seed, index) => {
  const school = ISSUE_TARGETS[index];

  return {
    ...seed,
    schoolId: school.id,
    schoolName: school.name,
    regionName: school.regionName,
  };
});

const INSPECTION_SEEDS: { id: string; target: number; type: string; date: string; state: Inspection['state']; note: string }[] = [
  { id: 'INS-08', target: 0, type: '긴급 점검', date: daysAhead(1), state: 'scheduled', note: '스트링 출력 저하 대응' },
  { id: 'INS-07', target: 1, type: '통신 복구', date: daysAgo(2), state: 'overdue', note: '모뎀 교체 자재 대기' },
  { id: 'INS-06', target: 2, type: '정기 점검', date: daysAhead(5), state: 'scheduled', note: '3분기 정기점검' },
  { id: 'INS-05', target: 3, type: '정기 점검', date: daysAgo(8), state: 'done', note: '냉각 팬 청소 완료' },
  { id: 'INS-04', target: 4, type: '일사량계 보정', date: daysAgo(12), state: 'done', note: '센서 영점 재설정' },
  { id: 'INS-03', target: 5, type: '정기 점검', date: daysAgo(16), state: 'done', note: '이상 없음' },
];

export const INSPECTIONS: Inspection[] = INSPECTION_SEEDS.map((seed) => {
  const school = ISSUE_TARGETS[seed.target];

  return {
    id: seed.id,
    schoolId: school.id,
    schoolName: school.name,
    type: seed.type,
    date: seed.date,
    state: seed.state,
    note: seed.note,
  };
});

export interface HealthReport {
  score: number;
  previousScore: number;
  factors: { label: string; value: number; note: string }[];
}

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

/** 상태별 설비 가동률 */
const AVAILABILITY_BY_STATUS: Record<OperationStatus, number> = {
  running: 1,
  ready: 0,
  degraded: 0.85,
  fault: 0.6,
  commLost: 0,
};

/**
 * 발전소 하나의 진단 점수를 그 설비의 실제 값에서 뽑아 낸다.
 * 이용률·운영 상태·미조치 이상 수·점검 이행률 네 가지를 같은 가중치로 본다.
 */
export function getPlantHealth(school: School): HealthReport {
  const issues = ISSUES.filter((issue) => issue.schoolId === school.id);
  const inspections = INSPECTIONS.filter((item) => item.schoolId === school.id);
  const doneCount = inspections.filter((item) => item.state === 'done').length;

  const efficiency = clamp(school.utilization / 0.176);
  const availability = AVAILABILITY_BY_STATUS[school.status];
  const response = clamp(1 - issues.filter((issue) => issue.severity !== 'info').length * 0.18);
  const inspection = inspections.length === 0 ? 1 : doneCount / inspections.length;

  const values = [efficiency, availability, response, inspection];
  const score = Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100);

  return {
    score,
    previousScore: Math.max(0, score - 3),
    factors: [
      { label: '발전 효율', value: efficiency, note: '설계 이용률 17.6% 대비' },
      { label: '설비 가동률', value: availability, note: `인버터 ${school.inverterCount}대 운영 상태` },
      { label: '이상 대응', value: response, note: `미조치 이상 ${issues.length}건` },
      { label: '점검 이행', value: inspection, note: `점검 ${doneCount}/${inspections.length || 0}건 완료` },
    ],
  };
}
