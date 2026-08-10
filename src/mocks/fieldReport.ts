import type {
  CheckResult,
  FieldReport,
  InspectedDevice,
  ReportState,
  ReportTemplate,
  TemplateRevision,
} from '@/interface/fieldReport';
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
  rejected: '반려',
};

/** 앞으로 나아가는 단계 — 반려는 여기 없다. 되돌린 자리는 따로 다룬다 (SFR-021-08). */
export const STATE_ORDER: ReportState[] = ['draft', 'submitted', 'reviewing', 'confirmed'];

/**
 * 점검 양식 (SFR-021-03/14/15).
 *
 * 표준 점검표를 그대로 옮겨 대분류 아래 문항을 둔다 — 현장에서 쓰는 종이 양식과 같은 순서라
 * 점검자가 옮겨 적기 쉽다. 항목을 여기서 관리하므로 양식을 고쳐도 화면은 그대로다.
 */
export const CHECKLIST_TEMPLATES: ReportTemplate[] = [
  {
    id: 'TPL-PLANT-REG',
    inspectType: '정기',
    targetKind: 'plant',
    label: '발전소 정기점검',
    version: 2,
    revisedAt: daysAgo(120),
    sections: [
      {
        title: '태양전지',
        items: [
          '출력: 일사량 대비 안정적 출력(월간 발전량 등) 확인',
          '외관: 변색(황변, 백화, Glass Back sheet 등), 변형 여부 확인',
          '외관: 적외선 열화상 측정 시 핫스팟 등 열화 현상 확인',
          '외관: 프레임 부식, 손상(파손) 확인',
          '음영: 어레이 설치 장소 주변으로 인한 음영 발생 확인',
          '접속함: 외함의 부식 및 손상, 접속점 및 부속품 발열 등 확인',
        ],
      },
      {
        title: '지지물',
        items: [
          '설치상태: 지지물이 충격 등에 대하여 안전한 상태인지 확인',
          '도금상태: 용융아연도금 상태, 절단면·용접 부분 녹 방지 유지 확인',
          '기초상태: 기초 부위, 지지대 등의 결속 및 정착 상태 이상 여부 확인',
          '볼트 체결상태: 녹 발생과 풀림 방지 와셔 사용 등 이상 여부 확인',
          '본딩: 태양전지 모듈과 지지대의 전기적 접속 상태 이상 여부 확인',
        ],
      },
      {
        title: '전선로',
        items: [
          '전선연결: 스트링별 DC 케이블 및 간선 접속부 발열 등 이상 여부 확인',
          '커넥터: 모듈·출력단자 파손 등 습기 및 빗물 침투 방지 구조 확인',
          '고정: 모듈 간 직렬 배선이 바람에 흔들리지 않도록 고정 확인',
        ],
      },
      {
        title: '전력변환장치 및 보호장치',
        items: [
          '외관: 외함 손상, 도금 상태 등 변형 여부 확인',
          '작동상태: 소음, 진동, 냄새 등 평소와 다른 현상 발생 확인',
          '전선로: 배선 손상, 접속단자(AC·DC) 체결, 관통 부분 마감 처리 확인',
          '설치환경: 제조사가 제시한 설치 환경(온도·습도·청소 상태) 준수 여부',
          '보호값 설정: 인버터 보호 요소 및 계전기 설정치 적정 여부',
        ],
      },
      {
        title: '주변환경',
        items: [
          '부지안전: 배수시설 맨홀 및 배수로 정비 상태 확인',
          '부지안전: 지지대 또는 지반의 침하가 없으며 고정 상태 확인',
          '부지안전: 부지 내 지반 침하, 토사 유출 등 흔적 유무',
          '구조물 등: 지붕과 기초, 구조물이 헐거움 없이 고정되었는지 확인',
          '구조물 등: 별도의 추가 하중 적재 등 위험물 설치 여부 확인',
        ],
      },
      {
        title: '기타',
        items: [
          '측정값: 절연 및 접지저항 측정',
          '기술기준: 기타 기술기준 등 관련 규정 적합 여부',
        ],
      },
    ],
  },
  {
    id: 'TPL-OM-REG',
    inspectType: '정기',
    targetKind: 'rtu',
    label: '설비 O&M 점검',
    version: 1,
    revisedAt: daysAgo(240),
    sections: [
      {
        title: '태양광 인버터 확인',
        items: [
          '인버터 동작 상태를 확인했는가? (발전 여부 및 LED 표시 등)',
          '인버터 디스플레이의 누적 발전량·전력 등 추가 정보를 확인했는가?',
          '인버터 국번을 확인하여 RTU 국번과 동일한지 확인했는가?',
        ],
      },
      {
        title: 'RTU 확인',
        items: [
          'RTU 의 전원 LED 표시등을 확인했는가?',
          '485 통신선이 정상적으로 체결되어 있는지 확인했는가?',
          '차단기 상태를 확인했는가?',
          '차단기가 내려간 경우 모니터링함 전원 케이블 체결 상태를 확인했는가?',
        ],
      },
      {
        title: '전원 공급 점검 절차',
        items: [
          '전원이 켜지지 않을 경우 멀티탭 연결 상태를 확인했는가?',
          '멀티미터기로 220V 전압을 확인했는가?',
        ],
      },
    ],
  },
  {
    id: 'TPL-INV-REG',
    inspectType: '정기',
    targetKind: 'inverter',
    label: '인버터 정기점검',
    version: 1,
    revisedAt: daysAgo(240),
    sections: [
      { title: '외관', items: ['외관 손상·부식 여부', '냉각 팬 동작과 통풍구 상태'] },
      { title: '동작', items: ['내부 온도 기준치(65℃) 이내', '표시부 경고 코드 유무'] },
      { title: '결선', items: ['단자대 조임 상태', '접지선 연결 상태'] },
    ],
  },
  {
    id: 'TPL-PLANT-SP',
    inspectType: '특별',
    targetKind: 'plant',
    label: '발전소 특별점검 (우천·강풍 후)',
    version: 1,
    revisedAt: daysAgo(240),
    sections: [
      { title: '침수·누전', items: ['침수·누수 흔적', '절연저항 측정값'] },
      { title: '구조물', items: ['구조물 변형·유격', '배수로 막힘'] },
    ],
  },
];

export const getTemplate = (id: string) => CHECKLIST_TEMPLATES.find((item) => item.id === id) ?? CHECKLIST_TEMPLATES[0];

/** 양식의 모든 문항을 대분류를 달고 한 줄로 편다 — 화면과 시드가 함께 쓴다. */
export function flattenTemplate(template: ReportTemplate): { id: string; section: string; label: string }[] {
  return template.sections.flatMap((section, sectionIndex) =>
    section.items.map((label, itemIndex) => ({
      id: `${template.id}-${sectionIndex}-${itemIndex}`,
      section: section.title,
      label,
    })));
}

/** 양식 개정 이력 (SFR-021-14) — 관리자 콘솔에서 새 판을 내면 이 위에 쌓인다. */
export const SEED_TEMPLATE_REVISIONS: TemplateRevision[] = [
  {
    id: 'TR-2602',
    templateId: 'TPL-PLANT-REG',
    templateLabel: '발전소 정기점검',
    version: 2,
    at: stampAgo(120, '10:30'),
    actor: '김도현',
    note: '태양전지 분류에 적외선 열화상 항목을 더했습니다.',
  },
  {
    id: 'TR-2601',
    templateId: 'TPL-PLANT-REG',
    templateLabel: '발전소 정기점검',
    version: 1,
    at: stampAgo(240, '09:00'),
    actor: '김도현',
    note: '표준 점검표로 최초 등록했습니다.',
  },
];

function pickResult(next: () => number): CheckResult {
  const roll = next();

  if (roll > 0.88) return 'abnormal';
  if (roll > 0.82) return 'na';

  return 'normal';
}

/** 점검한 설비 목록 — 양식이 겨눈 갈래에 맞춰 한두 대를 깔아 둔다 (SFR-021-06). */
function seedDevices(targetKind: ReportTemplate['targetKind'], order: number): InspectedDevice[] {
  if (targetKind === 'inverter') {
    return [{ id: `dev-${order}-1`, kind: '인버터', name: '인버터 #1', note: '' }];
  }

  if (targetKind === 'rtu') {
    return [
      { id: `dev-${order}-1`, kind: 'RTU', name: 'RTU #1', note: '' },
      { id: `dev-${order}-2`, kind: '인버터', name: '인버터 #1', note: '국번 일치 확인' },
    ];
  }

  return [
    { id: `dev-${order}-1`, kind: '모듈 어레이', name: '옥상 어레이 A', note: '' },
    { id: `dev-${order}-2`, kind: '접속반', name: '접속반 #1', note: '' },
    { id: `dev-${order}-3`, kind: '인버터', name: '인버터 #1', note: '' },
  ];
}

/** 시드 보고서 — 목록·이력 비교를 볼 수 있게 몇 건 깔아 둔다. */
function buildSeed(): FieldReport[] {
  const seeds: { index: number; templateId: string; state: ReportState; daysAgo: number; inspector: string }[] = [
    { index: 3, templateId: 'TPL-PLANT-REG', state: 'confirmed', daysAgo: 26, inspector: '이현수' },
    { index: 3, templateId: 'TPL-PLANT-REG', state: 'reviewing', daysAgo: 5, inspector: '이현수' },
    { index: 3, templateId: 'TPL-PLANT-REG', state: 'confirmed', daysAgo: 210, inspector: '이현수' },
    { index: 17, templateId: 'TPL-INV-REG', state: 'submitted', daysAgo: 9, inspector: '박정민' },
    { index: 31, templateId: 'TPL-OM-REG', state: 'confirmed', daysAgo: 14, inspector: '최유진' },
    { index: 46, templateId: 'TPL-PLANT-SP', state: 'draft', daysAgo: 2, inspector: '김도현' },
    { index: 17, templateId: 'TPL-INV-REG', state: 'rejected', daysAgo: 20, inspector: '박정민' },
  ];

  return seeds.map((seed, order) => {
    const school = SCHOOLS[seed.index % SCHOOLS.length];
    const template = getTemplate(seed.templateId);
    const next = createRandom(hashSeed(`field-${order}-${school.id}`));
    const checklist = flattenTemplate(template).map((item, itemIndex) => {
      const result = seed.state === 'draft' && itemIndex > 1 ? null : pickResult(next);

      return {
        ...item,
        result,
        note: result === 'abnormal' ? '재점검 필요. 사진 참고.' : '',
      };
    });
    const abnormalCount = checklist.filter((item) => item.result === 'abnormal').length;
    const rejected = seed.state === 'rejected';

    return {
      id: `FR-${String(2600 + order)}`,
      schoolId: school.id,
      schoolName: school.name,
      templateId: template.id,
      templateVersion: template.version,
      inspectType: template.inspectType,
      targetKind: template.targetKind,
      targetName: template.targetKind === 'inverter' ? '인버터 #1' : template.targetKind === 'rtu' ? 'RTU #1' : school.name,
      inspector: seed.inspector,
      date: daysAgo(seed.daysAgo),
      state: seed.state,
      checklist,
      devices: seedDevices(template.targetKind, order),
      photos: abnormalCount > 0
        ? [{ id: `photo-${order}`, name: `현장사진_${daysAgo(seed.daysAgo)}.jpg`, itemId: checklist.find((item) => item.result === 'abnormal')?.id ?? null }]
        : [],
      summary: abnormalCount > 0 ? `점검 항목 ${abnormalCount}건에서 이상을 확인했습니다.` : '점검 항목 전체 정상입니다.',
      actionNote: abnormalCount > 0 ? '해당 항목 부품을 교체하고 재측정했습니다.' : '',
      rejectReason: rejected ? '이상 항목 사진이 빠져 있습니다. 사진을 붙여 다시 올려 주세요.' : '',
      resubmitCount: 0,
      history: [
        { at: stampAgo(seed.daysAgo, '09:20'), actor: seed.inspector, change: '보고서를 작성했습니다.' },
        ...(seed.state !== 'draft'
          ? [{ at: stampAgo(seed.daysAgo, `1${Math.round(pickNumber(next, 0, 5))}:40`), actor: seed.inspector, change: '제출했습니다.' }]
          : []),
        ...(seed.state === 'confirmed'
          ? [{ at: stampAgo(seed.daysAgo - 1, '10:05'), actor: '교육청 시설과', change: '확인 완료로 처리했습니다.' }]
          : []),
        ...(rejected
          ? [{ at: stampAgo(seed.daysAgo - 1, '11:15'), actor: '교육청 시설과', change: '반려했습니다.' }]
          : []),
      ],
    };
  });
}

export const SEED_FIELD_REPORTS: FieldReport[] = buildSeed();

/** 반복 이슈로 볼 기간 — 같은 발전소·같은 항목이 이 안에서 두 번 이상 걸리면 잡는다 (SFR-021-13). */
export const REPEAT_WINDOW_DAYS = 365;

export interface RepeatIssue {
  schoolId: string;
  schoolName: string;
  label: string;
  count: number;
  /** 가장 최근 이상이 나온 점검일 */
  lastDate: string;
}

/**
 * 같은 발전소에서 같은 항목이 되풀이해 이상으로 나오는지 (SFR-021-13).
 * 범위는 최근 1년으로 못 박는다 — 예전에 한 번 고친 항목이 영원히 남지 않게 한다.
 */
export function findRepeatIssues(reports: FieldReport[]): RepeatIssue[] {
  const from = daysAgo(REPEAT_WINDOW_DAYS);
  const counter = new Map<string, RepeatIssue>();

  reports
    .filter((report) => report.date >= from && report.state !== 'draft')
    .forEach((report) => {
      report.checklist
        .filter((item) => item.result === 'abnormal')
        .forEach((item) => {
          const key = `${report.schoolId}-${item.label}`;
          const found = counter.get(key);

          if (found) {
            found.count += 1;
            if (report.date > found.lastDate) found.lastDate = report.date;

            return;
          }

          counter.set(key, {
            schoolId: report.schoolId,
            schoolName: report.schoolName,
            label: item.label,
            count: 1,
            lastDate: report.date,
          });
        });
    });

  return [...counter.values()]
    .filter((item) => item.count >= 2)
    .sort((a, b) => b.count - a.count || b.lastDate.localeCompare(a.lastDate));
}
