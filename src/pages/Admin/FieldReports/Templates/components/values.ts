import { daysAhead, TODAY } from '@/mocks/today';
import type { ReportTemplate } from '@/interface/fieldReport';
import type { TemplateFormValues } from './form';

/** 새 양식은 오늘 열어 한 달 뒤 닫는 것을 기본으로 둔다 */
export const EMPTY_VALUES: TemplateFormValues = {
  templateName: '',
  reportTypeName: '정기점검',
  targetTypeName: '전체',
  startDate: TODAY.format('YYYY-MM-DD'),
  endDate: daysAhead(30),
  checkList: [{ checkName: '' }],
  fixRemark: '',
};

/** 문항은 화면에서 한 행에 하나씩 적으므로 행 배열로 풀어 넘긴다 */
export function toFormValues(template: ReportTemplate): TemplateFormValues {
  return {
    templateName: template.label,
    // 목업은 「정기」로 줄여 들고 계약은 「정기점검」이 그 이름이다.
    reportTypeName: `${template.inspectType}점검`,
    targetTypeName: template.targetType,
    startDate: template.startDate,
    endDate: template.dueDate,
    checkList: template.items.map((checkName) => ({ checkName })),
    fixRemark: '',
  };
}

/**
 * 저장할 값이 지금 양식과 다른지. 다른 때만 버전이 오르고 개정 사유를 받는다 (SFR-021-14).
 * 문항뿐 아니라 이름·유형·대상·기간까지 본다 — 어느 칸을 고쳐도 앞 버전과 다른 양식이 된다.
 */
export function hasChange(values: Omit<TemplateFormValues, 'fixRemark'>, template: ReportTemplate): boolean {
  const saved = toFormValues(template);

  return values.templateName.trim() !== saved.templateName
    || values.reportTypeName !== saved.reportTypeName
    || values.targetTypeName !== saved.targetTypeName
    || values.startDate !== saved.startDate
    || values.endDate !== saved.endDate
    || JSON.stringify(toCheckNameList(values.checkList)) !== JSON.stringify(template.items);
}

/** 빈 행은 문항으로 세지 않는다 — 비워 둔 채 저장한 행이 문항이 되면 점검자가 헛클릭한다 */
export function toCheckNameList(checkList: TemplateFormValues['checkList']): string[] {
  return checkList.map((item) => item.checkName.trim()).filter(Boolean);
}
