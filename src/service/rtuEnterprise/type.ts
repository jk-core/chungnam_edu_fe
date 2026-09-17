import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { EMAIL, EMAIL_MAX } from '@/schemas/email';
import { pagingParamsSchema } from '@/service/common';

/** RTU 업체 이름 길이 제한 */
export const NAME_MAX = 40;

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

/**
 * 등록 요청 한 벌. 검증 규칙을 여기 두는 것은 이 스키마가 곧 폼이 지키는 계약이기 때문이다.
 * 이메일·전화번호는 업체에 따라 하나만 있는 곳이 있어 둘 다 비울 수 있다.
 */
export type ManageRtuEnterpriseAddParams = z.infer<typeof manageRtuEnterpriseAddSchema>;
export const manageRtuEnterpriseAddSchema = z.object({
  rtuEnterpriseName: z
    .string()
    .trim()
    .min(1, MSG.requiredField('업체 이름'))
    .max(NAME_MAX, MSG.tooLong('업체 이름', NAME_MAX)),
  rtuEnterpriseEmail: z
    .string()
    .trim()
    .max(EMAIL_MAX, MSG.tooLong('이메일', EMAIL_MAX))
    .refine((value) => !value || EMAIL.test(value), '이메일 형식이 올바르지 않습니다.'),
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
