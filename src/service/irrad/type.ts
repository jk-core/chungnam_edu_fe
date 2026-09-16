import { z } from 'zod';
import { dropdownSchema, pagingParamsSchema } from '@/service/common';

/*
  RTU 통신상태(`rtuCommunicationStateCode`)는 발전 운전상태와 다른 축이고 코드값이 아직
  미정이라 숫자·문자로 둔다 (`configs/codes.ts` 의 「BE 확정 대기」 참조).
*/

export type ManageIrradPageParams = z.infer<typeof manageIrradPageParamsSchema>;
export const manageIrradPageParamsSchema = pagingParamsSchema.extend({
  irradId: z.number().int().optional(),
  irradName: z.string().optional(),
  rtuCommunicationId: z.string().optional(),
});

export type ManageIrradPage = z.infer<typeof manageIrradPageSchema>;
export const manageIrradPageSchema = z.object({
  irradId: z.number().int(),
  irradName: z.string(),
  rtuCommunicationId: z.string(),
  rtuCommunicationStateCode: z.number().int(),
  rtuCommunicationStateName: z.string(),
});

/** 상세는 포트·캘리브레이션·비고까지 든다 */
export type ManageIrradDetail = z.infer<typeof manageIrradDetailSchema>;
export const manageIrradDetailSchema = manageIrradPageSchema.extend({
  calibrationFactor: z.number(),
  rtuPort: z.number().int(),
  isModTemp: z.boolean(),
  etc: z.string(),
});

/**
 * 등록 요청 한 벌. 어느 발전소의 것인지는 여기서 정하지 않는다 —
 * 발전소 쪽이 `irradId` 로 건다.
 */
export type ManageIrradAddParams = z.infer<typeof manageIrradAddParamsSchema>;
export const manageIrradAddParamsSchema = z.object({
  irradName: z.string(),
  calibrationFactor: z.number().min(0).max(10),
  rtuCommunicationId: z.string().optional(),
  rtuPort: z.number().int(),
  isModTemp: z.boolean(),
  etc: z.string().optional(),
});

/** 수정은 포트를 받지 않는다 — 등록 때 정한 자리를 그대로 쓴다 */
export type ManageIrradModifyParams = z.infer<typeof manageIrradModifyParamsSchema>;
export const manageIrradModifyParamsSchema = manageIrradAddParamsSchema.omit({ rtuPort: true }).extend({
  irradId: z.number().int(),
});

export type IrradDropdown = z.infer<typeof irradDropdownSchema>;
export const irradDropdownSchema = dropdownSchema(z.number().int());
