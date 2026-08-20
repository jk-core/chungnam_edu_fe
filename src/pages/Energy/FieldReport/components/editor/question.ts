import type { ChecklistItem } from '@/interface/fieldReport';

/**
 * 답을 적기 전의 문항.
 * 양식을 펼치면 나오는 것은 문항뿐이고, 답과 미흡 내용은 초안이 따로 쥔다.
 */
export type TemplateQuestion = Omit<ChecklistItem, 'result' | 'note'>;
