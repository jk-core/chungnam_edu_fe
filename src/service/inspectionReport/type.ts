import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { INSPECTION_TARGET_OPTIONS } from '@/mocks/fieldReport';

export const LABEL_MAX = 60;
export const CHECK_NAME_MAX = 200;
export const REVISION_NOTE_MAX = 200;

// ── 폼 ─────────────────────────────────────────────────────

/**
 * 점검 양식 등록·수정 폼 (SFR-021-14/19).
 *
 * 문항은 한 행에 하나씩 적는다 — 행마다 오류가 따로 붙고 빼기·추가가 그 자리에서 된다.
 * 판 번호는 폼이 정하지 않는다: 새 양식은 1 판, **문항을 고칠 때만** 한 판 오른다.
 * 기간은 이번 회차를 언제까지 내는지다 — 다음 회차는 이 두 날짜만 고쳐 연다.
 *
 * `needsNote` 는 문항이 실제로 바뀌었는지다. 기간만 고쳤으면 남길 개정이 없어 받지 않는다.
 */
export function templateFormSchema(isNew: boolean, needsNote: boolean) {
  return z
    .object({
      label: z
        .string()
        .trim()
        .min(1, MSG.requiredField('양식명'))
        .max(LABEL_MAX, MSG.tooLong('양식명', LABEL_MAX)),
      inspectType: z.enum(['정기', '특별']),
      targetType: z.enum(INSPECTION_TARGET_OPTIONS),
      startDate: z.string().min(1, MSG.selectRequired('시작일')),
      dueDate: z.string().min(1, MSG.selectRequired('마감기한')),
      items: z
        .array(z.object({
          label: z
            .string()
            .trim()
            .min(1, MSG.requiredField('문항'))
            .max(CHECK_NAME_MAX, MSG.tooLong('문항', CHECK_NAME_MAX)),
        }))
        .min(1, '문항을 한 개 이상 적어 주세요.'),
      /** 무엇을 왜 고쳤는지. 새로 세우거나 기간만 고쳤을 때는 남길 앞 판이 없어 받지 않는다 */
      note: isNew || !needsNote
        ? z.string()
        : z
          .string()
          .trim()
          .min(1, MSG.requiredField('개정 사유'))
          .max(REVISION_NOTE_MAX, MSG.tooLong('개정 사유', REVISION_NOTE_MAX)),
    })
    .superRefine((values, ctx) => {
      if (values.dueDate < values.startDate) {
        ctx.addIssue({ code: 'custom', path: ['dueDate'], message: '마감기한은 시작일보다 앞설 수 없습니다.' });
      }
    });
}

export type TemplateFormValues = z.infer<ReturnType<typeof templateFormSchema>>;
