import { z } from 'zod';
import { ZodUserTypeCode } from '@/configs/codes';
import { dropdownSchema } from '@/service/common';

export type SignInParams = z.infer<typeof signInParamsSchema>;
export const signInParamsSchema = z.object({
  loginId: z.string(),
  password: z.string(),
});

/**
 * 로그인 응답. 사용자 이름·등급은 여기 없다 — 토큰을 쥔 뒤 `getUserInfo` 로 따로 받는다.
 * `refreshTokenId` 는 재발급할 때 refreshToken 과 짝으로 함께 보내야 한다.
 */
export type SignIn = z.infer<typeof signInSchema>;
export const signInSchema = z.object({
  userId: z.number().int(),
  refreshTokenId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
});

/** 재발급은 새 accessToken 문자열 하나만 돌려준다 — 감싼 객체가 아니다 */
export type ReissuanceParams = z.infer<typeof reissuanceParamsSchema>;
export const reissuanceParamsSchema = z.object({
  refreshTokenId: z.string(),
  refreshToken: z.string(),
});

/** 관리자가 남의 비밀번호를 새로 정한다 — 기존 비밀번호를 묻지 않는다 */
export type InitializePasswordParams = z.infer<typeof initializePasswordParamsSchema>;
export const initializePasswordParamsSchema = z.object({
  loginId: z.string(),
  newPassword: z.string(),
});

/** 본인이 바꾼다 — 기존 비밀번호를 함께 보낸다 */
export type ChangePasswordParams = z.infer<typeof changePasswordParamsSchema>;
export const changePasswordParamsSchema = z.object({
  password: z.string(),
  newPassword: z.string(),
});

/** 헤더 프로필·메뉴 노출·라우트 가드가 함께 본다 */
export type UserDetail = z.infer<typeof userDetailSchema>;
export const userDetailSchema = z.object({
  userId: z.number().int(),
  loginId: z.string(),
  userName: z.string(),
  userTypeCode: ZodUserTypeCode.CODE,
  userTypeName: ZodUserTypeCode.NAME,
});

/**
 * 사용자 드롭다운 한 줄.
 *
 * 여기서만 `id` 가 문자열(로그인 ID)이다 — 다른 드롭다운은 모두 숫자 식별자를 준다.
 * 발전소·설비가 담당자를 걸 때 쓰는 `userId` 는 숫자라, 이 값을 그대로 실어 보내면 맞지 않는다.
 */
export type UserDropdown = z.infer<typeof userDropdownSchema>;
export const userDropdownSchema = dropdownSchema(z.string());
