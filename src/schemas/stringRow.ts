import { z } from 'zod';
import { MSG } from '@/configs/messages';

/*
  스트링 편집판의 한 줄. 스트링 판(Plants/String)과 설비 폼(Plants/Equipment) 두 화면이 함께
  쓰므로 페이지 폴더가 아니라 여기 둔다 — 한쪽에 두면 다른 페이지가 그 폴더를 넘겨다봐야 한다.

  BE v2.0 에는 아직 스트링을 저장하는 엔드포인트가 없다. 그래서 이것은 계약이 아니라
  화면이 지키는 입력 규칙이다.
*/

/** 한 스트링이 받을 수 있는 직렬·병렬 수 */
export const STRING_COUNT_MIN = 0;
export const STRING_COUNT_MAX = 1000;

export const STRING_NUMBER_MIN = 1;
export const STRING_NUMBER_MAX = 999;

export const NAME_MAX = 120;

const count = (label: string) => z
  .number(MSG.numberRange(label, STRING_COUNT_MIN, STRING_COUNT_MAX))
  .int()
  .min(STRING_COUNT_MIN, MSG.numberRange(label, STRING_COUNT_MIN, STRING_COUNT_MAX))
  .max(STRING_COUNT_MAX, MSG.numberRange(label, STRING_COUNT_MIN, STRING_COUNT_MAX));

/** 편집판의 한 줄. `stringId` 가 없으면 이번에 새로 만든 줄이다. */
export type StringRow = z.infer<typeof stringRowSchema>;
export const stringRowSchema = z.object({
  stringId: z.number().int().nullable(),
  stringNumber: z
    .number(MSG.numberRange('순번', STRING_NUMBER_MIN, STRING_NUMBER_MAX))
    .int()
    .min(STRING_NUMBER_MIN, MSG.numberRange('순번', STRING_NUMBER_MIN, STRING_NUMBER_MAX))
    .max(STRING_NUMBER_MAX, MSG.numberRange('순번', STRING_NUMBER_MIN, STRING_NUMBER_MAX)),
  stringName: z.string().trim().min(1, MSG.requiredField('이름')).max(NAME_MAX, MSG.tooLong('이름', NAME_MAX)),
  moduleSerialCount: count('직렬'),
  moduleParallelCount: count('병렬'),
});

/**
 * 편집판을 담는 폼이 갖춰야 할 모양.
 * 스트링 판과 설비 폼이 같은 `StringRows` 를 쓰므로 둘 다 이 두 칸을 이 이름으로 들고 있어야 한다.
 */
export interface StringRowsShape {
  rows: StringRow[];
  /** 이미 저장돼 있어 피해야 할 순번. 편집판이 곧 전체 목록이면 빈 배열이다 */
  takenNumbers: number[];
}

/**
 * 순번은 판 안에서도, 이미 저장된 것과도 겹치면 안 된다.
 * 두 소비처가 같은 규칙을 보도록 검사를 여기 둔다.
 */
export function refineStringRows(values: StringRowsShape, ctx: z.RefinementCtx) {
  const seen = new Set(values.takenNumbers);

  values.rows.forEach((row, index) => {
    if (seen.has(row.stringNumber)) {
      ctx.addIssue({ code: 'custom', path: ['rows', index, 'stringNumber'], message: '순번이 겹칩니다.' });

      return;
    }

    seen.add(row.stringNumber);
  });
}
