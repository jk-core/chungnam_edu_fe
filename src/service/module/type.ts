import { z } from 'zod';
import { ZodCellTypeCode } from '@/configs/codes';
import { dropdownSchema, pagingParamsSchema } from '@/service/common';

/**
 * 모듈 검색 조건. 관리 목록과 설비 목록이 같은 조건을 쓴다.
 * `pwrMp` 는 범위가 아니라 값이 같은 것만 고른다.
 */
export type SolaModuleSearchParams = z.infer<typeof solaModuleSearchParamsSchema>;
export const solaModuleSearchParamsSchema = z.object({
  moduleId: z.number().int().optional(),
  moduleName: z.string().optional(),
  moduleEnterpriseName: z.string().optional(),
  pwrMp: z.number().optional(),
});

export type ManageSolaModulePageParams = z.infer<typeof manageSolaModulePageParamsSchema>;
export const manageSolaModulePageParamsSchema = solaModuleSearchParamsSchema.extend(pagingParamsSchema.shape);

/** 목록 한 줄 — 전기특성은 상세에서 받는다 */
export type ManageSolaModulePage = z.infer<typeof manageSolaModulePageSchema>;
export const manageSolaModulePageSchema = z.object({
  moduleId: z.number().int(),
  moduleName: z.string(),
  moduleEnterpriseName: z.string(),
  /** 최대출력(모듈당 용량, W) */
  pwrMp: z.number(),
});

/**
 * 전기특성까지 든 한 벌.
 *
 * 셀 종류 칸 이름이 조회와 저장에서 갈린다 — 조회는 `cellType`·`cellTypeName`,
 * 저장도 `cellType` 이다. 화면 폼은 `cellTypeCode` 로 들고 있어 보낼 때 이름을 갈아 끼운다.
 */
export type SolaModuleDetail = z.infer<typeof solaModuleDetailSchema>;
export const solaModuleDetailSchema = manageSolaModulePageSchema.extend({
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
  cellType: ZodCellTypeCode.CODE,
  cellTypeName: ZodCellTypeCode.NAME,
});

export type ManageSolaModuleAddParams = z.infer<typeof manageSolaModuleAddParamsSchema>;
export const manageSolaModuleAddParamsSchema = solaModuleDetailSchema.omit({
  moduleId: true,
  cellTypeName: true,
});

export type ManageSolaModuleModifyParams = z.infer<typeof manageSolaModuleModifyParamsSchema>;
export const manageSolaModuleModifyParamsSchema = manageSolaModuleAddParamsSchema.extend({
  moduleId: z.number().int(),
});

export type SolaModuleDropdown = z.infer<typeof solaModuleDropdownSchema>;
export const solaModuleDropdownSchema = dropdownSchema(z.number().int());
