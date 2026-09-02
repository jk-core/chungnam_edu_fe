import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { pagingRequest } from '@/service/common';
import { SELECTABLE_ROLES } from '@/mocks/accounts';

/** 비밀번호 규칙 — 영대문자·영소문자·숫자·특수문자를 각 하나 이상, 공백 없이 8~20자. */
export const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])(?=\S+$).{8,20}$/;

/** 폼 힌트와 오류 문구가 갈리지 않게 규칙을 한 문장으로 적어 둔다 */
export const PASSWORD_HINT = '영대문자·소문자·숫자·특수문자 각 1개 이상, 8~20자';

/** 로그인 계정에 쓸 수 있는 글자 */
export const LOGIN_ID = /^[A-Za-z0-9_]{4,20}$/;

/** 이메일 형식 — 서버가 보는 것과 같은 최소 규칙이다 */
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NAME_MAX = 14;
export const EMAIL_MAX = 50;
export const ORG_NAME_MAX = 60;

/** 검색어는 사용자 이름·로그인 ID·이메일을 함께 훑는다 */
export const userListRequestSchema = pagingRequest.extend({
  keyword: z.string().optional(),
  /** 그룹관리자 탭처럼 한 등급만 볼 때 (userTypeCode) */
  userTypeCode: z.number().int().optional(),
});

export const userListRowSchema = z.object({
  userId: z.number().int(),
  loginId: z.string(),
  /** 사용자 이름 (userName) */
  name: z.string(),
  userTypeCode: z.number().int(),
  email: z.string(),
  /** 마지막 로그인 — 없으면 null */
  lastLoginAt: z.string().nullable(),
  /** 로그인 실패가 쌓여 잠긴 계정인지 */
  locked: z.boolean(),
  /** 맡은 발전소 수 — 그룹관리자 목록이 쓴다 */
  plantCount: z.number().int(),
});

export const userDetailRequestSchema = z.object({
  userId: z.number().int(),
});

export const userDetailResponseSchema = userListRowSchema.omit({ plantCount: true }).extend({
  /** 휴대전화번호 (cellPhone) */
  phone: z.string(),
  /** 조회 가능한 발전소. 빈 배열이면 제한 없음 */
  powerPlantIds: z.array(z.number().int()),
});

/**
 * `userId` 가 있으면 수정, 없으면 등록.
 * 비밀번호는 등록에만 필수고, 수정에서는 적었을 때만 실어 보낸다.
 */
export const userSaveRequestSchema = userDetailResponseSchema
  .omit({ lastLoginAt: true, locked: true })
  .partial({ userId: true })
  .extend({ password: z.string().optional() });

export const userDeleteRequestSchema = z.object({
  userId: z.number().int(),
});

export type UserListRequest = z.infer<typeof userListRequestSchema>;
export type UserListRow = z.infer<typeof userListRowSchema>;
export type UserDetailRequest = z.infer<typeof userDetailRequestSchema>;
export type UserDetailResponse = z.infer<typeof userDetailResponseSchema>;
export type UserSaveRequest = z.infer<typeof userSaveRequestSchema>;
export type UserDeleteRequest = z.infer<typeof userDeleteRequestSchema>;

// ── 폼 ─────────────────────────────────────────────────────

/**
 * 사용자 등록·수정 폼 (SFR-018).
 *
 * 비밀번호 규칙이 등록과 수정에서 갈린다 — 등록은 반드시 넣어야 하고, 수정은 비워 두면 기존
 * 것을 그대로 쓴다. `isNew` 는 폼이 사는 동안 바뀌지 않으므로 스키마를 만들어 쓴다.
 */
export function userFormSchema(isNew: boolean) {
  return z.object({
    name: z.string().trim().min(1, MSG.requiredField('이름')).max(NAME_MAX, MSG.tooLong('이름', NAME_MAX)),
    orgName: z.string().trim().max(ORG_NAME_MAX, MSG.tooLong('소속', ORG_NAME_MAX)),
    email: z
      .string()
      .trim()
      .max(EMAIL_MAX, MSG.tooLong('이메일', EMAIL_MAX))
      .refine((value) => !value || EMAIL.test(value), '이메일 형식이 올바르지 않습니다.'),
    phone: z.string(),
    loginId: z.string().trim().regex(LOGIN_ID, '영문·숫자·밑줄 4~20자로 넣어 주세요.'),
    password: z
      .string()
      .refine((value) => (isNew || value ? PASSWORD_RULE.test(value) : true), `${PASSWORD_HINT}로 넣어 주세요.`),
    passwordConfirm: z.string(),
    role: z.enum(SELECTABLE_ROLES),
  }).refine((values) => values.password === values.passwordConfirm, {
    path: ['passwordConfirm'],
    message: '비밀번호가 서로 다릅니다.',
  });
}

export type UserFormValues = z.infer<ReturnType<typeof userFormSchema>>;

/** 그룹관리자 편집 폼 (SFR-018, SFR-023) — 정하는 것은 그 사람이 볼 발전소뿐이다 */
export const groupFormSchema = z.object({
  userId: z.string().min(1, MSG.selectRequired('그룹관리자')),
  /** 보일 이름 — 규칙은 id 가 진다 (참조가 지워지면 이름만 비는데 오류를 보여 줄 자리가 없다) */
  userLabel: z.string(),
  plantIds: z.array(z.string()).min(1, '맡을 발전소를 한 곳 이상 골라 주세요.'),
});

export type GroupFormValues = z.infer<typeof groupFormSchema>;
