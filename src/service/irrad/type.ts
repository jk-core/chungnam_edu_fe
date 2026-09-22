import { z } from 'zod';
import { dropdownSchema, pagingParamsSchema } from '@/service/common';

/*
  RTU 통신상태(`rtuStatusCode`)는 발전 운전상태와 다른 축이고 코드값이 아직 미정이라
  숫자·문자로 둔다 (`configs/codes.ts` 의 「BE 확정 대기」 참조).
*/

/** 검색어는 일사량계명·RTU 통신 ID 를 훑는다. 발전소로도 좁힐 수 있다 */
export type ManageIrradPageParams = z.infer<typeof manageIrradPageParamsSchema>;
export const manageIrradPageParamsSchema = pagingParamsSchema.extend({
  keyword: z.string().optional(),
  powerPlantId: z.number().int().optional(),
});

/** 목록 한 줄 — 통신상태·캘리브레이션·비고는 상세에서 받는다 */
export type ManageIrradPage = z.infer<typeof manageIrradPageSchema>;
export const manageIrradPageSchema = z.object({
  irradId: z.number().int(),
  irradName: z.string(),
  powerPlantName: z.string(),
  rtuCommunicationId: z.string(),
  rtuPort: z.number().int(),
  isModTemp: z.boolean(),
});

export type ManageIrradDetail = z.infer<typeof manageIrradDetailSchema>;
export const manageIrradDetailSchema = manageIrradPageSchema.extend({
  powerPlantId: z.number().int(),
  rtuStatusCode: z.number().int(),
  rtuStatusName: z.string(),
  calibrationFactor: z.number(),
  etc: z.string(),
});

/** 등록 요청 한 벌. 어느 발전소의 것인지를 여기서 정한다 */
export type ManageIrradAddParams = z.infer<typeof manageIrradAddParamsSchema>;
export const manageIrradAddParamsSchema = z.object({
  powerPlantId: z.number().int(),
  irradName: z.string(),
  rtuCommunicationId: z.string(),
  /** 3번 고정. 고를 수 없는 값이지만 서버가 필수로 받는다 */
  rtuPort: z.number().int(),
  isModTemp: z.boolean(),
  calibrationFactor: z.number().min(0).max(10),
  etc: z.string(),
});

export type ManageIrradModifyParams = z.infer<typeof manageIrradModifyParamsSchema>;
export const manageIrradModifyParamsSchema = manageIrradAddParamsSchema.extend({
  irradId: z.number().int(),
});

export type IrradDropdown = z.infer<typeof irradDropdownSchema>;
export const irradDropdownSchema = dropdownSchema(z.number().int());
