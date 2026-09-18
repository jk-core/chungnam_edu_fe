import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { refineStringRows, stringRowSchema } from '@/schemas/stringRow';

/**
 * 스트링 편집판 (SFR-016-01).
 *
 * 등록은 더할 줄이 한 줄은 있어야 하지만, **수정은 줄을 모두 빼는 것이 곧 전체 삭제**라
 * 빈 판도 저장할 수 있어야 한다. `isEdit` 은 폼이 사는 동안 바뀌지 않으므로 지어 쓴다.
 *
 * BE v2.0 에 스트링 저장 엔드포인트가 아직 없어, 이것은 화면이 지키는 입력 규칙일 뿐이다.
 */
export type StringSheetFormValues = z.infer<ReturnType<typeof stringSheetFormSchema>>;
export function stringSheetFormSchema(isEdit: boolean) {
  return z.object({
    cid: z.number(MSG.selectRequired('설비')).int(),
    equipmentLabel: z.string(),
    rows: isEdit
      ? z.array(stringRowSchema)
      : z.array(stringRowSchema).min(1, '등록할 스트링을 한 줄 이상 추가해 주세요.'),
    takenNumbers: z.array(z.number().int()),
  }).superRefine(refineStringRows);
}
