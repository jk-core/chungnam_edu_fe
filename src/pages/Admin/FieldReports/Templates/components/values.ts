import { daysAhead, TODAY } from '@/mocks/today';
import type { TemplateFormValues } from '@/service/inspectionReport/type';
import type { ReportTemplate } from '@/interface/fieldReport';

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
 * 문항이 실제로 바뀌었는지. 바뀐 때만 판이 오르고 개정 사유를 받는다 (SFR-021-14).
 * 기간만 고친 것은 다음 회차를 여는 일이지 양식을 고친 일이 아니다.
 */
export function hasItemChange(checkList: TemplateFormValues['checkList'], template: ReportTemplate): boolean {
  return JSON.stringify(toCheckNameList(checkList)) !== JSON.stringify(template.items);
}

/** 빈 행은 문항으로 세지 않는다 — 비워 둔 채 저장한 행이 문항이 되면 점검자가 헛클릭한다 */
export function toCheckNameList(checkList: TemplateFormValues['checkList']): string[] {
  return checkList.map((item) => item.checkName.trim()).filter(Boolean);
}
