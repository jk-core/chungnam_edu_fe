import { z } from 'zod';
import { ZodCellTypeCode } from '@/configs/codes';
import { dropdownSchema, pagingParamsSchema } from '@/service/common';

/** 모듈 전기특성 — 관리 상세와 설비용 조회가 함께 든다 */
const moduleSpecShape = {
  /** 최대전압 */
  vltMp: z.number(),
  /** 최대전류 */
  curMp: z.number(),
  /** 개방전압 */
  vltOc: z.number(),
  /** 단락전류 */
  curSc: z.number(),
  /** 전류 온도계수 */
  tempCurCof: z.number(),
  /** 전압 온도계수 */
  tempVltCof: z.number(),
};

/** 검색어는 모델명·업체명을 훑는다 */
export type ManageSolaModulePageParams = z.infer<typeof manageSolaModulePageParamsSchema>;
export const manageSolaModulePageParamsSchema = pagingParamsSchema.extend({
  keyword: z.string().optional(),
});

/** 목록 한 줄 — 전기특성은 상세에서 받는다 */
export type ManageSolaModulePage = z.infer<typeof manageSolaModulePageSchema>;
export const manageSolaModulePageSchema = z.object({
  moduleId: z.number().int(),
  moduleName: z.string(),
  moduleEnterpriseName: z.string(),
  /** 최대출력(모듈당 용량, W) */
  pwrMp: z.number(),
  cellTypeCode: ZodCellTypeCode.CODE,
  cellTypeName: ZodCellTypeCode.NAME,
});

/** 전기특성까지 든 한 벌 */
export type ManageSolaModuleDetail = z.infer<typeof manageSolaModuleDetailSchema>;
export const manageSolaModuleDetailSchema = manageSolaModulePageSchema.extend(moduleSpecShape);

export type ManageSolaModuleAddParams = z.infer<typeof manageSolaModuleAddParamsSchema>;
export const manageSolaModuleAddParamsSchema = manageSolaModuleDetailSchema.omit({
  moduleId: true,
  cellTypeName: true,
});

export type ManageSolaModuleModifyParams = z.infer<typeof manageSolaModuleModifyParamsSchema>;
export const manageSolaModuleModifyParamsSchema = manageSolaModuleAddParamsSchema.extend({
  moduleId: z.number().int(),
});

/*
  아래는 관리 화면 밖에서 모델 제원을 읽는 자리다 — 설비 폼의 모델 검색기와 용량 계산이 쓴다.
  셀 종류 칸 이름이 관리와 갈린다 — 관리는 `cellTypeCode`, 여기는 `cellType` 이다.
*/
export type SolaModuleSearchParams = z.infer<typeof solaModuleSearchParamsSchema>;
export const solaModuleSearchParamsSchema = z.object({
  moduleId: z.number().int().optional(),
  moduleName: z.string().optional(),
  moduleEnterpriseName: z.string().optional(),
  pwrMp: z.number().optional(),
});

export type SolaModuleDetail = z.infer<typeof solaModuleDetailSchema>;
export const solaModuleDetailSchema = z.object({
  moduleId: z.number().int(),
  moduleName: z.string(),
  moduleEnterpriseName: z.string(),
  pwrMp: z.number(),
  cellType: ZodCellTypeCode.CODE,
  cellTypeName: ZodCellTypeCode.NAME,
  ...moduleSpecShape,
});

export type SolaModuleDropdown = z.infer<typeof solaModuleDropdownSchema>;
export const solaModuleDropdownSchema = dropdownSchema(z.number().int());
