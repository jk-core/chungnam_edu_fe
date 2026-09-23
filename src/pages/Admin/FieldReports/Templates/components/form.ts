import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { INSPECTION_TARGET_OPTIONS } from '@/mocks/fieldReport';

export const LABEL_MAX = 60;
export const CHECK_NAME_MAX = 200;
export const REVISION_NOTE_MAX = 200;

/**
 * 점검 양식 등록·수정 폼 (SFR-021-14/19).
 *
 * 점검유형·점검대상은 **코드값이 미정**이라 이름을 들고 있는다 (`reportTypeName`·`targetTypeName`).
 * 문항은 계약이 문자열 배열이지만 편집판은 행마다 오류를 붙여야 해 객체 배열로 든다.
 * 빈 행은 문항으로 세지 않는다 — 비워 둔 채 저장한 행이 문항이 되면 점검자가 헛클릭한다.
 *
 * 버전 번호는 폼이 정하지 않는다: 새 양식은 v1, **어느 칸이든 고치면** 한 버전 오른다.
 * 기간은 이번 회차를 언제까지 내는지다.
 * `needsNote` 는 저장할 값이 지금 양식과 다른지다. 고친 것이 없으면 남길 개정이 없어 받지 않는다.
 *
 * BE v2.0 에 점검 양식 엔드포인트가 아직 없다 — 이것은 화면이 지키는 입력 규칙이다.
 */
export type TemplateFormValues = z.infer<ReturnType<typeof templateFormSchema>>;
export function templateFormSchema(isNew: boolean, needsNote: boolean) {
  return z.object({
    templateName: z.string().trim().min(1, MSG.requiredField('양식명')).max(LABEL_MAX, MSG.tooLong('양식명', LABEL_MAX)),
    startDate: z.string().min(1, MSG.selectRequired('시작일')),
    endDate: z.string().min(1, MSG.selectRequired('마감기한')),
    reportTypeName: z.enum(['정기점검', '특별점검']),
    targetTypeName: z.enum(INSPECTION_TARGET_OPTIONS),
    checkList: z
      .array(z.object({
        checkName: z
          .string()
          .trim()
          .min(1, MSG.requiredField('문항'))
          .max(CHECK_NAME_MAX, MSG.tooLong('문항', CHECK_NAME_MAX)),
      }))
      .min(1, '문항을 한 개 이상 적어 주세요.'),
    /** 무엇을 왜 고쳤는지. 새로 세우거나 고친 것이 없을 때는 남길 개정이 없어 받지 않는다 */
    fixRemark: isNew || !needsNote
      ? z.string()
      : z
        .string()
        .trim()
        .min(1, MSG.requiredField('개정 사유'))
        .max(REVISION_NOTE_MAX, MSG.tooLong('개정 사유', REVISION_NOTE_MAX)),
  }).superRefine((values, ctx) => {
    if (values.endDate < values.startDate) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: '마감기한은 시작일보다 앞설 수 없습니다.' });
    }
  });
}
