import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { ZodInverterTypeCode, ZodPhaseTypeCode } from '@/configs/codes';
import { pagingParamsSchema } from '@/service/common';

/** 인버터 용량 범위(kW) */
export const CAPACITY_MIN = 0;
export const CAPACITY_MAX = 5000;

export const NAME_MAX = 120;

/** 검색어는 인버터명·업체명을 훑는다 */
export type ManageInverterPageParams = z.infer<typeof manageInverterPageParamsSchema>;
export const manageInverterPageParamsSchema = pagingParamsSchema.extend({
  keyword: z.string().optional(),
  inverterTypeCode: ZodInverterTypeCode.CODE.optional(),
});

export type ManageInverterPage = z.infer<typeof manageInverterPageSchema>;
export const manageInverterPageSchema = z.object({
  inverterId: z.number().int(),
  inverterName: z.string(),
  inverterEnterpriseName: z.string(),
  inverterCapacity: z.number(),
  inverterTypeCode: ZodInverterTypeCode.CODE,
  inverterTypeName: ZodInverterTypeCode.NAME,
  phaseTypeCode: ZodPhaseTypeCode.CODE,
  phaseTypeName: ZodPhaseTypeCode.NAME,
});

export type ManageInverterDetailParams = z.infer<typeof manageInverterDetailParamsSchema>;
export const manageInverterDetailParamsSchema = z.object({
  inverterId: z.number().int(),
});

export type ManageInverterDetail = z.infer<typeof manageInverterDetailSchema>;
export const manageInverterDetailSchema = manageInverterPageSchema;

/**
 * 등록 요청 한 벌. 검증 규칙을 여기 두는 것은 이 스키마가 곧 폼이 지키는 계약이기 때문이다.
 */
export type ManageInverterAddParams = z.infer<typeof manageInverterAddSchema>;
export const manageInverterAddSchema = z.object({
  inverterName: z.string().trim().min(1, MSG.requiredField('인버터 이름')).max(NAME_MAX, MSG.tooLong('인버터 이름', NAME_MAX)),
  inverterEnterpriseName: z.string().trim().min(1, MSG.requiredField('업체 이름')).max(NAME_MAX, MSG.tooLong('업체 이름', NAME_MAX)),
  inverterCapacity: z
    .number(MSG.numberRange('인버터 용량', CAPACITY_MIN, CAPACITY_MAX))
    .gt(CAPACITY_MIN, MSG.numberRange('인버터 용량', CAPACITY_MIN, CAPACITY_MAX))
    .max(CAPACITY_MAX, MSG.numberRange('인버터 용량', CAPACITY_MIN, CAPACITY_MAX)),
  inverterTypeCode: ZodInverterTypeCode.CODE,
  phaseTypeCode: ZodPhaseTypeCode.CODE,
});

export type ManageInverterModifyParams = z.infer<typeof manageInverterModifySchema>;
export const manageInverterModifySchema = manageInverterAddSchema.extend({
  inverterId: z.number().int(),
});

export type ManageInverterRemoveParams = z.infer<typeof manageInverterRemoveParamsSchema>;
export const manageInverterRemoveParamsSchema = z.object({
  inverterId: z.number().int(),
});

// ── 폼 ─────────────────────────────────────────────────────

/**
 * 인버터 제품 등록·수정 폼 (SFR-017-04).
 * 요청 스키마를 그대로 쓴다 — 서버 번호(`inverterId`)는 폼이 만지는 값이 아니라 여기 없다.
 */
export type InverterFormValues = z.infer<typeof inverterFormSchema>;
export const inverterFormSchema = manageInverterAddSchema;
