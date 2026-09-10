import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { pagingParamsSchema } from '@/service/common';

/** 한 스트링이 받을 수 있는 직렬·병렬 수 */
export const STRING_COUNT_MIN = 0;
export const STRING_COUNT_MAX = 1000;

export const STRING_NUMBER_MIN = 1;
export const STRING_NUMBER_MAX = 999;

export const NAME_MAX = 120;

/** 목록 한 줄은 스트링 한 조가 아니라 설비 한 대(cid) 다 */
export type ManageStringPageParams = z.infer<typeof manageStringPageParamsSchema>;
export const manageStringPageParamsSchema = pagingParamsSchema.extend({
  keyword: z.string().optional(),
});

export type ManageStringPage = z.infer<typeof manageStringPageSchema>;
export const manageStringPageSchema = z.object({
  cid: z.number().int(),
  powerPlantName: z.string(),
  equipmentName: z.string(),
  stringCount: z.number().int(),
  moduleCount: z.number().int(),
});

export type ManageStringDetailParams = z.infer<typeof manageStringDetailParamsSchema>;
export const manageStringDetailParamsSchema = z.object({
  cid: z.number().int(),
});

export type ManageStringDetail = z.infer<typeof manageStringDetailSchema>;
export const manageStringDetailSchema = z.object({
  cid: z.number().int(),
  equipmentName: z.string(),
  powerPlantName: z.string(),
  list: z.array(z.object({
    stringId: z.number().int(),
    stringNumber: z.number().int(),
    stringName: z.string(),
    moduleSerialCount: z.number().int(),
    moduleParallelCount: z.number().int(),
    stringCapacity: z.number(),
  })),
});

const count = (label: string) => z
  .number(MSG.numberRange(label, STRING_COUNT_MIN, STRING_COUNT_MAX))
  .int()
  .min(STRING_COUNT_MIN, MSG.numberRange(label, STRING_COUNT_MIN, STRING_COUNT_MAX))
  .max(STRING_COUNT_MAX, MSG.numberRange(label, STRING_COUNT_MIN, STRING_COUNT_MAX));

/**
 * 편집판의 한 줄. `stringId` 가 없으면 이번에 새로 만든 줄이다.
 * 검증 규칙을 여기 두는 것은 이 스키마가 곧 폼이 지키는 계약이기 때문이다.
 */
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
 * 스트링만 POST/PUT 을 나누지 않는다. 한 번의 요청이 등록·수정·삭제를 함께 한다 —
 * 줄마다 stringId 가 있으면 수정, 없으면 등록이고 목록에서 빠진 줄은 서버가 지운다.
 * 빈 배열이 곧 전체 삭제다.
 */
export type ManageStringSaveParams = z.infer<typeof manageStringSaveSchema>;
export const manageStringSaveSchema = z.object({
  cid: z.number().int(),
  /*
    새 줄은 stringId 를 아예 싣지 않는다 — 편집판은 빈 줄을 null 로 들지만 그대로 보내면
    「stringId 가 null 인 줄을 수정」으로 읽혀 등록이 삼켜진다.
  */
  list: z.array(stringRowSchema.omit({ stringId: true }).extend({
    stringId: z.number().int().optional(),
  })),
});

export type ManageStringRemoveParams = z.infer<typeof manageStringRemoveParamsSchema>;
export const manageStringRemoveParamsSchema = z.object({
  stringId: z.number().int(),
});

// ── 폼 ─────────────────────────────────────────────────────

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

/**
 * 스트링 편집판 (SFR-016-01).
 *
 * 등록은 더할 줄이 한 줄은 있어야 하지만, **수정은 줄을 모두 빼는 것이 곧 전체 삭제**라
 * 빈 판도 저장할 수 있어야 한다. `isEdit` 은 폼이 사는 동안 바뀌지 않으므로 지어 쓴다.
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
