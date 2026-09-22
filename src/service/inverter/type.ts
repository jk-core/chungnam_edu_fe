import { z } from 'zod';
import { ZodInverterTypeCode, ZodPhaseTypeCode } from '@/configs/codes';
import { pagingParamsSchema } from '@/service/common';

/** 검색어는 모델명·업체명을 훑는다. 기종은 따로 좁힌다 */
export type ManageInverterPageParams = z.infer<typeof manageInverterPageParamsSchema>;
export const manageInverterPageParamsSchema = pagingParamsSchema.extend({
  keyword: z.string().optional(),
  inverterTypeCode: ZodInverterTypeCode.CODE.optional(),
});

/** 목록 한 줄. 상세도 같은 것을 준다 — 제품 제원이 이 여덟 칸이 전부다 */
export type ManageInverterPage = z.infer<typeof manageInverterPageSchema>;
export const manageInverterPageSchema = z.object({
  inverterId: z.number().int(),
  inverterName: z.string(),
  inverterEnterpriseName: z.string(),
  /** 정격 용량 (kW) */
  inverterCapacity: z.number(),
  inverterTypeCode: ZodInverterTypeCode.CODE,
  inverterTypeCodeName: ZodInverterTypeCode.NAME,
  phaseTypeCode: ZodPhaseTypeCode.CODE,
  phaseTypeName: ZodPhaseTypeCode.NAME,
});

/** 폼이 주소로 바로 열려 그 줄이 손에 없을 때 쓴다 */
export type ManageInverterDetail = ManageInverterPage;

/** 등록 요청 한 벌. 길이·범위 규칙은 폼이 진다 (`Devices/Inverter/components/form.ts`) */
export type ManageInverterAddParams = z.infer<typeof manageInverterAddParamsSchema>;
export const manageInverterAddParamsSchema = manageInverterPageSchema.omit({
  inverterId: true,
  inverterTypeCodeName: true,
  phaseTypeName: true,
});

export type ManageInverterModifyParams = z.infer<typeof manageInverterModifyParamsSchema>;
export const manageInverterModifyParamsSchema = manageInverterAddParamsSchema.extend({
  inverterId: z.number().int(),
});
