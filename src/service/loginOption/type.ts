import { z } from 'zod';

/**
 * 시스템 전역 로그인 설정. 싱글턴(단일 행)이라 식별자를 받지 않는다.
 *
 * 저장은 네 값을 통째로 바꾼다 — 일부만 보내는 요청은 없어 요청·응답이 한 벌이다.
 * (명세는 수정 요청의 네 칸을 모두 선택으로 적고 있으나, 화면은 언제나 네 값을 함께 보낸다.)
 */
export type LoginOption = z.infer<typeof loginOptionSchema>;
export const loginOptionSchema = z.object({
  /** 비밀번호 재설정 주기 (일) */
  pwdResetCycle: z.number().int(),
  /** 로그인 실패 허용 횟수 (회) */
  loginFailLimit: z.number().int(),
  /** 로그인 유지 시간 — 관리자 (분) */
  adminLoginKeepTime: z.number().int(),
  /** 로그인 유지 시간 — 사용자 (분) */
  userLoginKeepTime: z.number().int(),
});

export type LoginOptionModifyParams = LoginOption;
export const loginOptionModifyParamsSchema = loginOptionSchema;
