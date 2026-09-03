import { daysAhead, TODAY } from '@/mocks/today';
import type { TemplateFormValues } from '@/service/inspectionReport/type';
import type { ReportTemplate } from '@/interface/fieldReport';

/** 새 양식은 오늘 열어 한 달 뒤 닫는 것을 기본으로 둔다 */
export const EMPTY_VALUES: TemplateFormValues = {
  label: '',
  inspectType: '정기',
  targetType: '전체',
  startDate: TODAY.format('YYYY-MM-DD'),
  dueDate: daysAhead(30),
  sections: [{ title: '', items: '' }],
  note: '',
};

/** 문항은 화면에서 한 줄에 하나씩 적으므로 줄바꿈으로 이어 붙여 넘긴다 */
export function toFormValues(template: ReportTemplate): TemplateFormValues {
  return {
    label: template.label,
    inspectType: template.inspectType,
    targetType: template.targetType,
    startDate: template.startDate,
    dueDate: template.dueDate,
    sections: template.sections.map((section) => ({ title: section.title, items: section.items.join('\n') })),
    note: '',
  };
}

/**
 * 문항이 실제로 바뀌었는지. 바뀐 때만 판이 오르고 개정 사유를 받는다 (SFR-021-14).
 * 기간만 고친 것은 다음 회차를 여는 일이지 양식을 고친 일이 아니다.
 */
export function hasSectionChange(sections: TemplateFormValues['sections'], template: ReportTemplate): boolean {
  return JSON.stringify(toSections(sections)) !== JSON.stringify(template.sections);
}

/** 빈 줄은 문항으로 세지 않는다 — 붙여 넣다 남은 줄이 문항이 되면 점검자가 헛클릭한다 */
export function toSections(sections: TemplateFormValues['sections']): ReportTemplate['sections'] {
  return sections
    .map((section) => ({
      title: section.title.trim(),
      items: section.items.split('\n').map((item) => item.trim()).filter(Boolean),
    }))
    .filter((section) => section.items.length > 0);
}
