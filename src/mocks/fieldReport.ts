import type { CheckResult, FieldReport, ReportState, ReportTemplate } from '@/interface/fieldReport';
import { SCHOOLS } from './schools';
import { createRandom, hashSeed, pickNumber } from './random';
import { daysAgo, stampAgo } from './today';

export const CHECK_LABEL: Record<CheckResult, string> = {
  normal: '정상',
  abnormal: '이상',
  na: '해당없음',
};

export const REPORT_STATE_LABEL: Record<ReportState, string> = {
  draft: '작성중',
  submitted: '제출완료',
  reviewing: '검토중',
  confirmed: '확인완료',
};

/** 상태 전이 순서 — 뒤로는 돌아가지 않는다. */
export const STATE_ORDER: ReportState[] = ['draft', 'submitted', 'reviewing', 'confirmed'];

/**
 * 점검 양식 (SFR-021-03/14/15).
 * 항목을 여기서 관리하면 양식을 늘리거나 바꿀 때 화면을 건드리지 않아도 된다.
 */
export const CHECKLIST_TEMPLATES: ReportTemplate[] = [
  {
    id: 'TPL-INV-REG',
    inspectType: '정기',
    targetKind: 'inverter',
    label: '인버터 정기점검',
    items: [
      '외관 손상·부식 여부',
      '냉각 팬 동작과 통풍구 상태',
      '내부 온도 기준치(65℃) 이내',
      '표시부 경고 코드 유무',
      '단자대 조임 상태',
      '접지선 연결 상태',
    ],
  },
  {
    id: 'TPL-RTU-REG',
    inspectType: '정기',
    targetKind: 'rtu',
    label: 'RTU 정기점검',
    items: [
      '함체 방수·잠금 상태',
      '전원 및 상태 LED',
      'LTE 신호 세기(-110dBm 이상)',
      'RS-485 결선 상태',
      '수집 주기 설정값',
    ],
  },
  {
    id: 'TPL-PLANT-REG',
    inspectType: '정기',
    targetKind: 'plant',
    label: '발전소 정기점검',
    items: [
      '모듈 표면 오염·파손',
      '어레이 주변 음영물',
      '접속함 퓨즈·차단기',
      '케이블 피복 손상',
      '구조물 체결 상태',
      '일사량계 수평·오염',
    ],
  },
  {
    id: 'TPL-PLANT-SP',
    inspectType: '특별',
    targetKind: 'plant',
    label: '발전소 특별점검 (우천·강풍 후)',
    items: [
      '침수·누수 흔적',
      '절연저항 측정값',
      '구조물 변형·유격',
      '배수로 막힘',
    ],
  },
];

export const getTemplate = (id: string) => CHECKLIST_TEMPLATES.find((item) => item.id === id) ?? CHECKLIST_TEMPLATES[0];

function pickResult(next: () => number): CheckResult {
  const roll = next();

  if (roll > 0.88) return 'abnormal';
  if (roll > 0.82) return 'na';

  return 'normal';
}

/** 시드 보고서 — 목록·이력 비교를 볼 수 있게 몇 건 깔아 둔다. */
function buildSeed(): FieldReport[] {
  const seeds: { index: number; templateId: string; state: ReportState; daysAgo: number; inspector: string }[] = [
    { index: 3, templateId: 'TPL-PLANT-REG', state: 'confirmed', daysAgo: 26, inspector: '이현수' },
    { index: 3, templateId: 'TPL-PLANT-REG', state: 'reviewing', daysAgo: 5, inspector: '이현수' },
    { index: 17, templateId: 'TPL-INV-REG', state: 'submitted', daysAgo: 9, inspector: '박정민' },
    { index: 31, templateId: 'TPL-RTU-REG', state: 'confirmed', daysAgo: 14, inspector: '최유진' },
    { index: 46, templateId: 'TPL-PLANT-SP', state: 'draft', daysAgo: 2, inspector: '김도현' },
  ];

  return seeds.map((seed, order) => {
    const school = SCHOOLS[seed.index % SCHOOLS.length];
    const template = getTemplate(seed.templateId);
    const next = createRandom(hashSeed(`field-${order}-${school.id}`));
    const checklist = template.items.map((label, itemIndex) => {
      const result = seed.state === 'draft' && itemIndex > 1 ? null : pickResult(next);

      return {
        id: `${template.id}-${itemIndex}`,
        label,
        result,
        note: result === 'abnormal' ? '재점검 필요. 사진 참고.' : '',
      };
    });
    const abnormalCount = checklist.filter((item) => item.result === 'abnormal').length;

    return {
      id: `FR-${String(2600 + order)}`,
      schoolId: school.id,
      schoolName: school.name,
      templateId: template.id,
      inspectType: template.inspectType,
      targetKind: template.targetKind,
      targetName: template.targetKind === 'inverter' ? '인버터 #1' : template.targetKind === 'rtu' ? 'RTU #1' : school.name,
      inspector: seed.inspector,
      date: daysAgo(seed.daysAgo),
      state: seed.state,
      checklist,
      photos: abnormalCount > 0
        ? [{ id: `photo-${order}`, name: `현장사진_${daysAgo(seed.daysAgo)}.jpg`, itemId: checklist.find((item) => item.result === 'abnormal')?.id ?? null }]
        : [],
      summary: abnormalCount > 0 ? `점검 항목 ${abnormalCount}건에서 이상을 확인했습니다.` : '점검 항목 전체 정상입니다.',
      actionNote: abnormalCount > 0 ? '해당 항목 부품을 교체하고 재측정했습니다.' : '',
      history: [
        { at: stampAgo(seed.daysAgo, '09:20'), actor: seed.inspector, change: '보고서를 작성했습니다.' },
        ...(seed.state !== 'draft'
          ? [{ at: stampAgo(seed.daysAgo, `1${Math.round(pickNumber(next, 0, 5))}:40`), actor: seed.inspector, change: '제출했습니다.' }]
          : []),
        ...(seed.state === 'confirmed'
          ? [{ at: stampAgo(seed.daysAgo - 1, '10:05'), actor: '교육청 시설과', change: '확인 완료로 처리했습니다.' }]
          : []),
      ],
    };
  });
}

export const SEED_FIELD_REPORTS: FieldReport[] = buildSeed();

/** 같은 학교에서 같은 항목이 반복해 이상으로 나오는지 (SFR-021-13) */
export function findRepeatIssues(reports: FieldReport[]): { label: string; count: number; schoolName: string }[] {
  const counter = new Map<string, { label: string; count: number; schoolName: string }>();

  reports.forEach((report) => {
    report.checklist
      .filter((item) => item.result === 'abnormal')
      .forEach((item) => {
        const key = `${report.schoolId}-${item.label}`;
        const found = counter.get(key);

        if (found) found.count += 1;
        else counter.set(key, { label: item.label, count: 1, schoolName: report.schoolName });
      });
  });

  return [...counter.values()].filter((item) => item.count >= 2).sort((a, b) => b.count - a.count);
}
