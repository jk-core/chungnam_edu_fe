import { z } from 'zod';
import { ZodUserTypeCode } from '@/configs/codes';
import { pagingParamsSchema } from '@/service/common';

/** 사용자 ID 와 이름으로 좁힌다 — 둘 다 비우면 전체다 */
export type ManageUserPageParams = z.infer<typeof manageUserPageParamsSchema>;
export const manageUserPageParamsSchema = pagingParamsSchema.extend({
  userId: z.number().int().optional(),
  userName: z.string().optional(),
});

/** 목록 한 줄은 세 칸뿐이다 — 등급·연락처는 상세에서 받는다 */
export type ManageUserPage = z.infer<typeof manageUserPageSchema>;
export const manageUserPageSchema = z.object({
  userId: z.number().int(),
  loginId: z.string(),
  userName: z.string(),
});

export type ManageUserDetail = z.infer<typeof manageUserDetailSchema>;
export const manageUserDetailSchema = manageUserPageSchema.extend({
  userTypeCode: ZodUserTypeCode.CODE,
  userTypeName: ZodUserTypeCode.NAME,
});

/** 등록은 관리자가 비밀번호를 직접 정하므로 필수다 */
export type ManageUserAddParams = z.infer<typeof manageUserAddParamsSchema>;
export const manageUserAddParamsSchema = z.object({
  loginId: z.string(),
  userName: z.string(),
  password: z.string(),
  userTypeCode: ZodUserTypeCode.CODE,
  cellPhone: z.string(),
});

/** 비밀번호는 적었을 때만 실어 보낸다 — 비우면 기존 것을 그대로 둔다 */
export type ManageUserModifyParams = z.infer<typeof manageUserModifyParamsSchema>;
export const manageUserModifyParamsSchema = manageUserAddParamsSchema.extend({
  userId: z.number().int(),
  password: z.string().optional(),
});
