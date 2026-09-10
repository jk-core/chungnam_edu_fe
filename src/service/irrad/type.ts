import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { pagingParamsSchema } from '@/service/common';

/** 일사량계 이름 길이 제한 */
export const NAME_MAX = 48;

/** 캘리브레이션 인수 허용 범위 */
export const FACTOR_MIN = 0;
export const FACTOR_MAX = 10;

/** 통신 ID 는 장비 설정 화면에 그대로 들어가는 값이라 영숫자만 받는다. */
export const COMMUNICATION_ID = /^[A-Za-z0-9]+$/;

/** 검색어는 일사량계명·RTU통신ID 를 훑는다 */
export type ManageIrradPageParams = z.infer<typeof manageIrradPageParamsSchema>;
export const manageIrradPageParamsSchema = pagingParamsSchema.extend({
  keyword: z.string().optional(),
  powerPlantId: z.number().int().optional(),
});

export type ManageIrradPage = z.infer<typeof manageIrradPageSchema>;
export const manageIrradPageSchema = z.object({
  irradId: z.number().int(),
  irradName: z.string(),
  powerPlantName: z.string(),
  rtuCommunicationId: z.string(),
  rtuPort: z.number().int(),
  isModTemp: z.boolean(),
});

export type ManageIrradDetailParams = z.infer<typeof manageIrradDetailParamsSchema>;
export const manageIrradDetailParamsSchema = z.object({
  irradId: z.number().int(),
});

export type ManageIrradDetail = z.infer<typeof manageIrradDetailSchema>;
export const manageIrradDetailSchema = manageIrradPageSchema.extend({
  powerPlantId: z.number().int(),
  rtuStatusCode: z.number().int(),
  rtuStatusName: z.string(),
  calibrationFactor: z.number(),
  etc: z.string(),
});

/**
 * 등록 요청 한 벌. 검증 규칙을 여기 두는 것은 이 스키마가 곧 폼이 지키는 계약이기 때문이다.
 * RTU 포트는 3번 고정이라 폼이 고르지 않고 저장할 때 상수로 얹는다.
 */
export type ManageIrradAddParams = z.infer<typeof manageIrradAddSchema>;
export const manageIrradAddSchema = z.object({
  powerPlantId: z.number(MSG.selectRequired('발전소')).int(),
  irradName: z.string().trim().min(1, MSG.requiredField('설비 이름')).max(NAME_MAX, MSG.tooLong('설비 이름', NAME_MAX)),
  rtuCommunicationId: z.string().trim().regex(COMMUNICATION_ID, 'RTU 통신 ID 는 영문·숫자만 넣을 수 있습니다.'),
  rtuPort: z.number().int(),
  isModTemp: z.boolean(),
  calibrationFactor: z
    .number(MSG.numberRange('캘리브레이션 인수', FACTOR_MIN, FACTOR_MAX))
    .min(FACTOR_MIN, MSG.numberRange('캘리브레이션 인수', FACTOR_MIN, FACTOR_MAX))
    .max(FACTOR_MAX, MSG.numberRange('캘리브레이션 인수', FACTOR_MIN, FACTOR_MAX)),
  etc: z.string(),
});

export type ManageIrradModifyParams = z.infer<typeof manageIrradModifySchema>;
export const manageIrradModifySchema = manageIrradAddSchema.extend({
  irradId: z.number().int(),
});

export type ManageIrradRemoveParams = z.infer<typeof manageIrradRemoveParamsSchema>;
export const manageIrradRemoveParamsSchema = z.object({
  irradId: z.number().int(),
});

// ── 폼 ─────────────────────────────────────────────────────

/** 일사량계 등록·수정 폼 (SFR-016-01). 포트는 고를 수 없어 폼에서 뺀다 */
export type IrradFormValues = z.infer<typeof irradFormSchema>;
export const irradFormSchema = manageIrradAddSchema.omit({ rtuPort: true });
