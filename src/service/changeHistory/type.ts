import { z } from 'zod';

/** 변경 이력 대상 타입 — `/manage/changeHistory` 의 targetType. RTU 업체는 아직 BE 가 쌓지 않는다 */
export const changeHistoryTargetTypeSchema = z.enum([
  'USER',
  'POWER_PLANT',
  'INVERTER',
  'MODULE',
  'STRING',
  'IRRAD',
]);
export type ChangeHistoryTargetType = z.infer<typeof changeHistoryTargetTypeSchema>;

/** 작업 종류 */
export const changeHistoryOperationSchema = z.enum(['CREATE', 'UPDATE', 'DELETE']);
export type ChangeHistoryOperation = z.infer<typeof changeHistoryOperationSchema>;

/** 변경 필드의 전후 값 */
export type FieldChange = z.infer<typeof fieldChangeSchema>;
export const fieldChangeSchema = z.object({
  key: z.string(),
  label: z.string(),
  /** CREATE 시 null */
  oldValue: z.string().nullable(),
  /** DELETE 시 null */
  newValue: z.string().nullable(),
});

/** 대상 타입별 변경 이력 한 건 */
export type ChangeHistory = z.infer<typeof changeHistorySchema>;
export const changeHistorySchema = z.object({
  historyId: z.number().int(),
  targetType: changeHistoryTargetTypeSchema,
  targetId: z.number().int(),
  /** 변경 당시 스냅샷 표시명 */
  targetLabel: z.string(),
  operation: changeHistoryOperationSchema,
  /** 미인증 변경은 null */
  changedBy: z.string().nullable(),
  changedByName: z.string().nullable(),
  changedDtm: z.string(),
  changes: z.array(fieldChangeSchema),
});
