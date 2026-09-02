import type { TemplateFormValues } from '@/service/inspectionReport/type';
import type { ReportTemplate } from '@/interface/fieldReport';

export const EMPTY_VALUES: TemplateFormValues = {
  label: '',
  inspectType: '정기',
  targetType: '전체',
  sections: [{ title: '', items: '' }],
  note: '',
};

/** 문항은 화면에서 한 줄에 하나씩 적으므로 줄바꿈으로 이어 붙여 넘긴다 */
export function toFormValues(template: ReportTemplate): TemplateFormValues {
  return {
    label: template.label,
    inspectType: template.inspectType,
    targetType: template.targetType,
    sections: template.sections.map((section) => ({ title: section.title, items: section.items.join('\n') })),
    note: '',
  };
}

/** 빈 줄은 문항으로 세지 않는다 — 붙여 넣다 남은 줄이 문항이 되면 점검자가 헛클릭한다 */
export function toSections(values: TemplateFormValues): ReportTemplate['sections'] {
  return values.sections
    .map((section) => ({
      title: section.title.trim(),
      items: section.items.split('\n').map((item) => item.trim()).filter(Boolean),
    }))
    .filter((section) => section.items.length > 0);
}
