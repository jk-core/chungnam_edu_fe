import { z } from 'zod';
import { refineStringRows, stringRowSchema } from '@/schemas/stringRow';

/**
 * 스트링 편집판 (SFR-016-01).
 * 판이 곧 그 설비의 전체 목록이라 피할 순번이 없고, 빈 판도 저장할 수 있다.
 */
export type StringSheetFormValues = z.infer<typeof stringSheetFormSchema>;
export const stringSheetFormSchema = z.object({
  rows: z.array(stringRowSchema),
  takenNumbers: z.array(z.number().int()),
}).superRefine(refineStringRows);
