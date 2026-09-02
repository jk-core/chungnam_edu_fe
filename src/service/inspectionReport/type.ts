import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { INSPECTION_TARGET_OPTIONS } from '@/mocks/fieldReport';

export const LABEL_MAX = 60;
export const SECTION_TITLE_MAX = 30;
export const REVISION_NOTE_MAX = 200;

// ── 폼 ─────────────────────────────────────────────────────

/**
 * 점검 양식 등록·수정 폼 (SFR-021-14).
 *
 * 문항은 한 줄에 하나씩 적는 여러 줄 글칸이다 — 표 형태 편집기보다 옮겨 붙이기 쉽다.
 * 판 번호는 폼이 정하지 않는다: 새 양식은 1 판, 고치면 한 판 오른다.
 */
export function templateFormSchema(isNew: boolean) {
  return z.object({
    label: z
      .string()
      .trim()
      .min(1, MSG.requiredField('양식명'))
      .max(LABEL_MAX, MSG.tooLong('양식명', LABEL_MAX)),
    inspectType: z.enum(['정기', '특별']),
    targetType: z.enum(INSPECTION_TARGET_OPTIONS),
    sections: z
      .array(z.object({
        title: z
          .string()
          .trim()
          .min(1, MSG.requiredField('분류 이름'))
          .max(SECTION_TITLE_MAX, MSG.tooLong('분류 이름', SECTION_TITLE_MAX)),
        /** 화면은 여러 줄 글칸 하나로 받고, 저장할 때 줄 단위로 나눈다 */
        items: z.string().trim().min(1, MSG.requiredField('문항')),
      }))
      .min(1, '분류를 한 개 이상 두고 문항을 적어 주세요.'),
    /** 무엇을 왜 고쳤는지. 새로 세울 때는 남길 앞 판이 없어 받지 않는다 */
    note: isNew
      ? z.string()
      : z
        .string()
        .trim()
        .min(1, MSG.requiredField('개정 사유'))
        .max(REVISION_NOTE_MAX, MSG.tooLong('개정 사유', REVISION_NOTE_MAX)),
  });
}

export type TemplateFormValues = z.infer<ReturnType<typeof templateFormSchema>>;
