import { z } from 'zod';
import { ZodUserTypeCode } from '@/configs/codes';

export type UserSignInParams = z.infer<typeof userSignInSchema>;
export const userSignInSchema = z.object({
  loginId: z.string(),
  password: z.string(),
});

export type UserSignIn = z.infer<typeof userSignInResponseSchema>;
export const userSignInResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  refreshTokenId: z.string(),
  userId: z.number().int(),
  userName: z.string(),
  userTypeCode: ZodUserTypeCode.CODE,
  userTypeName: ZodUserTypeCode.NAME,
});

/**
 * 실패 응답 본문. 잠금까지 몇 번 남았는지를 화면이 세지 않는다 —
 * 브라우저를 바꾸거나 새로고침하면 클라이언트가 센 값은 틀어진다.
 */
export type UserSignInFail = z.infer<typeof userSignInFailSchema>;
export const userSignInFailSchema = z.object({
  message: z.string(),
  failCount: z.number().int(),
  maxFailCount: z.number().int(),
  isLocked: z.boolean(),
});

export type UserReissueParams = z.infer<typeof userReissueSchema>;
export const userReissueSchema = z.object({
  refreshToken: z.string(),
  refreshTokenId: z.string(),
});

export type UserReissue = z.infer<typeof userReissueResponseSchema>;
export const userReissueResponseSchema = z.object({
  accessToken: z.string(),
});

/** 헤더 프로필·메뉴 노출·라우트 가드가 함께 본다 */
export type UserInfo = z.infer<typeof userInfoSchema>;
export const userInfoSchema = z.object({
  userId: z.number().int(),
  loginId: z.string(),
  userName: z.string(),
  userTypeCode: ZodUserTypeCode.CODE,
  userTypeName: ZodUserTypeCode.NAME,
  orgName: z.string(),
  department: z.string(),
  email: z.string(),
  /** 조회가능발전소 — 빈 배열이면 제한 없음 */
  powerPlantIds: z.array(z.number().int()),
  expireDtm: z.string(),
});

export type UserPasswordParams = z.infer<typeof userPasswordSchema>;
export const userPasswordSchema = z.object({
  password: z.string(),
  newPassword: z.string(),
});
