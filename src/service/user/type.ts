import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { USER_TYPE, ZodUserTypeCode } from '@/configs/codes';
import { pagingParamsSchema } from '@/service/common';

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

/**
 * 이 화면이 만들고 고치는 것은 기관담당자·그룹관리자 둘뿐이라 목록도 그 범위로 좁혀 받는다.
 * 검색어는 사용자명·로그인ID·이메일을 훑는다.
 */
export type ManageUserPageParams = z.infer<typeof manageUserPageParamsSchema>;
export const manageUserPageParamsSchema = pagingParamsSchema.extend({
  keyword: z.string().optional(),
  userTypeCode: ZodUserTypeCode.CODE.optional(),
});

export type ManageUserPage = z.infer<typeof manageUserPageSchema>;
export const manageUserPageSchema = z.object({
  userId: z.number().int(),
  loginId: z.string(),
  userName: z.string(),
  userTypeCode: ZodUserTypeCode.CODE,
  userTypeName: ZodUserTypeCode.NAME,
  orgName: z.string(),
  email: z.string(),
  lastLoginDtm: z.string().nullable(),
  isLocked: z.boolean(),
  powerPlantCount: z.number().int(),
});

export type ManageUserDetailParams = z.infer<typeof manageUserDetailParamsSchema>;
export const manageUserDetailParamsSchema = z.object({
  userId: z.number().int(),
});

export type ManageUserDetail = z.infer<typeof manageUserDetailSchema>;
export const manageUserDetailSchema = manageUserPageSchema.omit({ powerPlantCount: true }).extend({
  cellPhone: z.string(),
  /** 조회 가능한 발전소. 빈 배열이면 제한 없음 */
  powerPlantIds: z.array(z.number().int()),
});

/**
 * 등록 요청 한 벌. 관리자가 비밀번호를 직접 정하므로 등록에서는 필수다.
 * 검증 규칙을 여기 두는 것은 이 스키마가 곧 폼이 지키는 계약이기 때문이다.
 */
export type ManageUserAddParams = z.infer<typeof manageUserAddSchema>;
export const manageUserAddSchema = z.object({
  loginId: z.string().trim().regex(LOGIN_ID, '영문·숫자·밑줄 4~20자로 넣어 주세요.'),
  userName: z.string().trim().min(1, MSG.requiredField('이름')).max(NAME_MAX, MSG.tooLong('이름', NAME_MAX)),
  userTypeCode: ZodUserTypeCode.CODE,
  orgName: z.string().trim().max(ORG_NAME_MAX, MSG.tooLong('소속', ORG_NAME_MAX)),
  email: z
    .string()
    .trim()
    .max(EMAIL_MAX, MSG.tooLong('이메일', EMAIL_MAX))
    .refine((value) => !value || EMAIL.test(value), '이메일 형식이 올바르지 않습니다.'),
  cellPhone: z.string(),
  powerPlantIds: z.array(z.number().int()),
  password: z.string(),
});

/**
 * 비밀번호는 적었을 때만 실어 보낸다 — 비우면 기존 것을 그대로 둔다.
 * isLocked 를 false 로 바꿀 때는 로그인 실패 횟수도 함께 0 으로 되돌아간다.
 */
export type ManageUserModifyParams = z.infer<typeof manageUserModifySchema>;
export const manageUserModifySchema = manageUserAddSchema.extend({
  userId: z.number().int(),
  isLocked: z.boolean(),
  password: z.string().optional(),
});

export type ManageUserRemoveParams = z.infer<typeof manageUserRemoveParamsSchema>;
export const manageUserRemoveParamsSchema = z.object({
  userId: z.number().int(),
});

// ── 폼 ─────────────────────────────────────────────────────

/** 이 화면이 세울 수 있는 등급 — 교육지원청 위로는 여기서 다루지 않는다 */
export const SELECTABLE_USER_TYPE_CODES = [USER_TYPE.CODE.기관담당자, USER_TYPE.CODE.그룹관리자] as const;

/**
 * 사용자 등록·수정 폼 (SFR-018).
 *
 * 요청 스키마를 넓혀 쓰되 담당 발전소는 뺀다 — 그것을 정하는 것은 그룹관리자 탭이다.
 * 비밀번호 규칙이 등록과 수정에서 갈린다: 등록은 반드시 넣어야 하고, 수정은 비워 두면
 * 기존 것을 그대로 쓴다. `isNew` 는 폼이 사는 동안 바뀌지 않으므로 스키마를 만들어 쓴다.
 */
export type UserFormValues = z.infer<ReturnType<typeof userFormSchema>>;
export function userFormSchema(isNew: boolean) {
  return manageUserAddSchema
    .omit({ powerPlantIds: true })
    .extend({
      userTypeCode: z.literal(SELECTABLE_USER_TYPE_CODES),
      password: z
        .string()
        .refine((value) => (isNew || value ? PASSWORD_RULE.test(value) : true), `${PASSWORD_HINT}로 넣어 주세요.`),
      passwordConfirm: z.string(),
    })
    .refine((values) => values.password === values.passwordConfirm, {
      path: ['passwordConfirm'],
      message: '비밀번호가 서로 다릅니다.',
    });
}

/** 그룹관리자 편집 폼 (SFR-018, SFR-023) — 정하는 것은 그 사람이 볼 발전소뿐이다 */
export type GroupFormValues = z.infer<typeof groupFormSchema>;
export const groupFormSchema = z.object({
  userId: z.number(MSG.selectRequired('그룹관리자')).int(),
  /** 보일 이름 — 규칙은 id 가 진다 (참조가 지워지면 이름만 비는데 오류를 보여 줄 자리가 없다) */
  userLabel: z.string(),
  powerPlantIds: z.array(z.number().int()).min(1, '맡을 발전소를 한 곳 이상 골라 주세요.'),
});
