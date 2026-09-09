import { z } from 'zod';
import { MSG } from '@/configs/messages';

/** 한 스트링이 받을 수 있는 직렬·병렬 수 */
export const STRING_COUNT_MIN = 0;
export const STRING_COUNT_MAX = 1000;

/** 편집판의 한 줄. `id` 가 없으면 이번에 새로 만든 줄이다 */
export const stringRowSchema = z.object({
  id: z.string().nullable(),
  seq: z.number(MSG.numberRange('순번', 1, 999)).int().min(1, MSG.numberRange('순번', 1, 999)),
  name: z.string().trim().min(1, MSG.requiredField('이름')).max(120, MSG.tooLong('이름', 120)),
  seriesCount: z
    .number(MSG.numberRange('직렬', STRING_COUNT_MIN, STRING_COUNT_MAX))
    .int()
    .min(STRING_COUNT_MIN, MSG.numberRange('직렬', STRING_COUNT_MIN, STRING_COUNT_MAX))
    .max(STRING_COUNT_MAX, MSG.numberRange('직렬', STRING_COUNT_MIN, STRING_COUNT_MAX)),
  parallelCount: z
    .number(MSG.numberRange('병렬', STRING_COUNT_MIN, STRING_COUNT_MAX))
    .int()
    .min(STRING_COUNT_MIN, MSG.numberRange('병렬', STRING_COUNT_MIN, STRING_COUNT_MAX))
    .max(STRING_COUNT_MAX, MSG.numberRange('병렬', STRING_COUNT_MIN, STRING_COUNT_MAX)),
});

export type StringRow = z.infer<typeof stringRowSchema>;

/**
 * 편집판을 담는 폼이 갖춰야 할 모양.
 * 스트링 판과 설비 폼이 같은 `StringRows` 를 쓰므로 둘 다 이 두 칸을 이 이름으로 들고 있어야 한다.
 */
export interface StringRowsShape {
  rows: StringRow[];
  /** 이미 저장돼 있어 피해야 할 순번. 편집판이 곧 전체 목록이면 빈 배열이다 */
  takenSeqs: number[];
}

/**
 * 순번은 판 안에서도, 이미 저장된 것과도 겹치면 안 된다.
 * 두 소비처가 같은 규칙을 보도록 검사를 여기 둔다.
 */
export function refineStringRows(values: StringRowsShape, ctx: z.RefinementCtx) {
  const seen = new Set(values.takenSeqs);

  values.rows.forEach((row, index) => {
    if (seen.has(row.seq)) {
      ctx.addIssue({ code: 'custom', path: ['rows', index, 'seq'], message: '순번이 겹칩니다.' });

      return;
    }

    seen.add(row.seq);
  });
}

/**
 * 스트링 편집판 (SFR-016-01).
 *
 * 등록은 더할 줄이 한 줄은 있어야 하지만, **수정은 줄을 모두 빼는 것이 곧 전체 삭제**라
 * 빈 판도 저장할 수 있어야 한다. `isEdit` 은 폼이 사는 동안 바뀌지 않으므로 지어 쓴다.
 */
export function stringSheetFormSchema(isEdit: boolean) {
  return z.object({
    inverterId: z.string().min(1, MSG.selectRequired('설비')),
    inverterLabel: z.string(),
    rows: isEdit
      ? z.array(stringRowSchema)
      : z.array(stringRowSchema).min(1, '등록할 스트링을 한 줄 이상 추가해 주세요.'),
    takenSeqs: z.array(z.number().int()),
  }).superRefine(refineStringRows);
}

export type StringSheetFormValues = z.infer<ReturnType<typeof stringSheetFormSchema>>;
