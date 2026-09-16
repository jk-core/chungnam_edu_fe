import { z } from 'zod';
import { MSG } from '@/configs/messages';
import { PASSWORD_HINT, PASSWORD_RULE } from '@/schemas/password';
import { USER_TYPE } from '@/configs/codes';

/** 로그인 계정에 쓸 수 있는 글자 */
export const LOGIN_ID = /^[A-Za-z0-9_]{4,20}$/;

/** 이메일 형식 — 서버가 보는 것과 같은 최소 규칙이다 */
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NAME_MAX = 14;
export const EMAIL_MAX = 50;
export const ORG_NAME_MAX = 60;

/** 이 화면이 세울 수 있는 등급 — 교육지원청 위로는 여기서 다루지 않는다 */
export const SELECTABLE_USER_TYPE_CODES = [USER_TYPE.CODE.기관담당자, USER_TYPE.CODE.그룹관리자] as const;

/**
 * 사용자 등록·수정 폼 (SFR-018).
 *
 * 담당 발전소는 여기서 빼 둔다 — 그것을 정하는 것은 그룹관리자 탭이다.
 * 비밀번호 규칙이 등록과 수정에서 갈린다: 등록은 반드시 넣어야 하고, 수정은 비워 두면
 * 기존 것을 그대로 쓴다. `isNew` 는 폼이 사는 동안 바뀌지 않으므로 스키마를 만들어 쓴다.
 *
 * **BE v2.0 의 `UserAddInfo` 가 아직 받지 않는 칸**: orgName · email.
 * 화면은 그대로 두고 저장할 때 계약에 있는 칸만 추려 보낸다.
 */
export type UserFormValues = z.infer<ReturnType<typeof userFormSchema>>;
export function userFormSchema(isNew: boolean) {
  return z.object({
    loginId: z.string().trim().regex(LOGIN_ID, '영문·숫자·밑줄 4~20자로 넣어 주세요.'),
    userName: z.string().trim().min(1, MSG.requiredField('이름')).max(NAME_MAX, MSG.tooLong('이름', NAME_MAX)),
    userTypeCode: z.literal(SELECTABLE_USER_TYPE_CODES),
    orgName: z.string().trim().max(ORG_NAME_MAX, MSG.tooLong('소속', ORG_NAME_MAX)),
    email: z
      .string()
      .trim()
      .max(EMAIL_MAX, MSG.tooLong('이메일', EMAIL_MAX))
      .refine((value) => !value || EMAIL.test(value), '이메일 형식이 올바르지 않습니다.'),
    cellPhone: z.string(),
    password: z
      .string()
      .refine((value) => (isNew || value ? PASSWORD_RULE.test(value) : true), `${PASSWORD_HINT}로 넣어 주세요.`),
    passwordConfirm: z.string(),
  }).refine((values) => values.password === values.passwordConfirm, {
    path: ['passwordConfirm'],
    message: '비밀번호가 서로 다릅니다.',
  });
}
