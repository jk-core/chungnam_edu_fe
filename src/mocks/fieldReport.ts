import type {
  CheckResult,
  FieldReport,
  InspectionTarget,
  InspectorRole,
  ReportBasics,
  ReportState,
  ReportTemplate,
  TemplateRevision,
} from '@/interface/fieldReport';
import { SCHOOLS } from './schools';
import { createRandom, hashSeed, pickNumber } from './random';
import { daysAgo, stampAgo } from './today';

export const CHECK_LABEL: Record<CheckResult, string> = {
  normal: '양호',
  abnormal: '미흡',
  na: '해당없음',
};

/** 머리 표의 네모칸 — 종이 양식에 적힌 순서를 그대로 쓴다 */
export const INSPECTOR_ROLE_OPTIONS: InspectorRole[] = ['소유자', '설비관리자', '시공기업'];

/** 점검대상 구분 — 작성 폼과 양식 관리가 같은 목록을 쓴다 */
export const INSPECTION_TARGET_OPTIONS = [
  '전체',
  'RTU',
  '인버터',
  '모듈 어레이',
  '일사량계',
  '기타',
] as const satisfies readonly InspectionTarget[];

/**
 * 점검결과에 미흡이 하나라도 있으면 띄우는 안내 (표준 체크리스트 하단).
 * 종이 양식이 표 아래 굵게 적어 두는 문장이라, 화면에서도 같은 자리에 같은 말로 남긴다.
 */
export const CHECKLIST_NOTICE = '점검결과 1개 이상의 미흡사항이 발생할 경우, 시공기업과 연락하여 반드시 개선 조치를 하여야 합니다.';

export const REPORT_STATE_LABEL: Record<ReportState, string> = {
  draft: '작성중',
  submitted: '제출완료',
  reviewing: '검토중',
  confirmed: '확인완료',
  rejected: '반려',
};

/** 목록 필터와 상태 표시가 쓰는 차례. 반려는 이 줄 밖에 있어 따로 붙인다 (SFR-021-08). */
export const STATE_ORDER: ReportState[] = ['draft', 'submitted', 'reviewing', 'confirmed'];

/**
 * 검토자가 제출된 보고서에 매기는 처리 (SFR-021-08).
 *
 * **단계를 밟아 나아가지 않는다** — 검토를 거쳐야 확인할 수 있는 것이 아니라 셋 중 하나를
 * 곧바로 고른다. 버튼에는 상태 이름(검토중·확인완료)이 아니라 시키는 일을 적는다.
 */
export const MANAGE_ACTIONS: { state: ReportState; label: string }[] = [
  { state: 'rejected', label: '반려' },
  { state: 'reviewing', label: '검토' },
  { state: 'confirmed', label: '확인' },
];

/**
 * 점검 양식 (SFR-021-03/14/15).
 *
 * 「자가용 태양광 설비 안전점검 체크리스트」 를 그대로 옮겼다. 현장에서 쓰는 종이와 문항도
 * 순서도 같아야 점검자가 옮겨 적을 때 줄을 세지 않는다.
 *
 * 종이의 「구분」 칸이 여기서는 대분류가 된다 — 구분마다 문항이 하나뿐이라 분류가 과해 보이지만,
 * 표를 그대로 옮기는 쪽이 낫다. 구분을 떼고 문항만 늘어놓으면 종이와 나란히 놓고 대조할 수 없다.
 */
export const CHECKLIST_TEMPLATES: ReportTemplate[] = [
  {
    id: 'TPL-SELF-SAFETY',
    inspectType: '정기',
    targetType: '전체',
    label: '자가용 태양광 설비 안전점검 체크리스트',
    version: 1,
    revisedAt: daysAgo(30),
    sections: [
      { title: '가동', items: ['시공기준에 적합하게 모듈, 인버터, 접속함 등은 정상적으로 운영 중인가?'] },
      { title: '모듈', items: ['외관상 모듈 파손이나 균열이 있는가?'] },
      { title: '결속', items: ['모듈과 지지대 사이의 결속은 양호한가?'] },
      { title: '지지대', items: ['각 지지대의 휨, 균열 등이 있는가?'] },
      { title: '기초', items: ['기초부위(콘크리트 등)의 균열 및 파손이 있는가?'] },
      { title: '인버터·접속함', items: ['인버터 및 접속함 내부상태는 양호한가?'] },
      { title: '배수·방수', items: ['설비 주변 배수 및 지붕방수 등에 문제는 없는가?'] },
      { title: '주변', items: ['태양광 설비 주변 정리 상태는 양호한가?'] },
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
    id: 'TR-2601',
    templateId: 'TPL-SELF-SAFETY',
    templateLabel: '자가용 태양광 설비 안전점검 체크리스트',
    version: 1,
    at: stampAgo(30, '09:00'),
    actor: '김도현',
    note: '자가용 태양광 설비 안전점검 체크리스트를 표준 양식으로 등록했습니다.',
  },
];

function pickResult(next: () => number): CheckResult {
  const roll = next();

  if (roll > 0.88) return 'abnormal';
  if (roll > 0.82) return 'na';

  return 'normal';
}

/** 머리 표 — 순번으로 돌려 고른다. 연락처가 빈 건도 하나 섞어 하이픈 표기를 보게 한다 */
function seedBasics(order: number): ReportBasics {
  return {
    inspectorRole: INSPECTOR_ROLE_OPTIONS[order % INSPECTOR_ROLE_OPTIONS.length],
    contact: order === 2 ? '' : `041-${String(500 + order)}-${String(1000 + order * 7).slice(0, 4)}`,
  };
}

/** 시드 보고서 — 목록·이력 비교를 볼 수 있게 몇 건 깔아 둔다. */
function buildSeed(): FieldReport[] {
  const seeds: { index: number; templateId: string; state: ReportState; daysAgo: number; inspector: string }[] = [
    { index: 3, templateId: 'TPL-SELF-SAFETY', state: 'confirmed', daysAgo: 26, inspector: '이현수' },
    { index: 3, templateId: 'TPL-SELF-SAFETY', state: 'reviewing', daysAgo: 5, inspector: '이현수' },
    { index: 3, templateId: 'TPL-SELF-SAFETY', state: 'confirmed', daysAgo: 210, inspector: '이현수' },
    { index: 17, templateId: 'TPL-SELF-SAFETY', state: 'submitted', daysAgo: 9, inspector: '박정민' },
    { index: 31, templateId: 'TPL-SELF-SAFETY', state: 'confirmed', daysAgo: 14, inspector: '최유진' },
    { index: 46, templateId: 'TPL-SELF-SAFETY', state: 'draft', daysAgo: 2, inspector: '김도현' },
    { index: 17, templateId: 'TPL-SELF-SAFETY', state: 'rejected', daysAgo: 20, inspector: '박정민' },
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
      // 같은 양식이어도 현장에서 무엇을 봤는지는 갈린다 — 목록 필터가 이 값으로 돈다.
      targetType: INSPECTION_TARGET_OPTIONS[order % INSPECTION_TARGET_OPTIONS.length],
      inspector: seed.inspector,
      date: daysAgo(seed.daysAgo),
      state: seed.state,
      basics: seedBasics(order),
      checklist,
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
