import { z } from 'zod';
import { pagingParamsSchema } from '@/service/common';

/** 검색어는 업체명·이메일·전화번호를 훑는다 */
export type ManageRtuEnterprisePageParams = z.infer<typeof manageRtuEnterprisePageParamsSchema>;
export const manageRtuEnterprisePageParamsSchema = pagingParamsSchema.extend({
  keyword: z.string().optional(),
});

export type ManageRtuEnterprisePage = z.infer<typeof manageRtuEnterprisePageSchema>;
export const manageRtuEnterprisePageSchema = z.object({
  rtuEnterpriseId: z.number().int(),
  rtuEnterpriseName: z.string(),
  rtuEnterpriseEmail: z.string(),
  rtuEnterprisePhone: z.string(),
});

export type ManageRtuEnterpriseDetailParams = z.infer<typeof manageRtuEnterpriseDetailParamsSchema>;
export const manageRtuEnterpriseDetailParamsSchema = z.object({
  rtuEnterpriseId: z.number().int(),
});

/** 상세가 든 것은 목록 줄과 같은 넷이다 — 폼이 주소로 바로 열려 그 줄이 손에 없을 때 쓴다 */
export type ManageRtuEnterpriseDetail = ManageRtuEnterprisePage;

/** 등록 요청 한 벌. 길이·형식 규칙은 폼이 진다 (`RtuEnterprise/components/form.ts`) */
export type ManageRtuEnterpriseAddParams = z.infer<typeof manageRtuEnterpriseAddSchema>;
export const manageRtuEnterpriseAddSchema = z.object({
  rtuEnterpriseName: z.string(),
  rtuEnterpriseEmail: z.string(),
  rtuEnterprisePhone: z.string(),
});

export type ManageRtuEnterpriseModifyParams = z.infer<typeof manageRtuEnterpriseModifySchema>;
export const manageRtuEnterpriseModifySchema = manageRtuEnterpriseAddSchema.extend({
  rtuEnterpriseId: z.number().int(),
});

export type ManageRtuEnterpriseRemoveParams = z.infer<typeof manageRtuEnterpriseRemoveParamsSchema>;
export const manageRtuEnterpriseRemoveParamsSchema = z.object({
  rtuEnterpriseId: z.number().int(),
});
