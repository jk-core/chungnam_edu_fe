import { z } from 'zod';

/**
 * 로그인 전에도 부르므로 인증을 걸지 않는다 — 로그인 화면 하단 안내문이 이 값을 적는다.
 * 저장은 네 값을 통째로 바꾼다: 일부만 보내는 요청은 없어 요청·응답이 한 벌이다.
 */
export type LoginPolicy = z.infer<typeof loginPolicySchema>;
export const loginPolicySchema = z.object({
  /** 비밀번호재설정주기(일) */
  passwordResetDay: z.number().int(),
  maxFailCount: z.number().int(),
  /** 관리자유지시간(분) */
  adminSessionMinute: z.number().int(),
  /** 일반사용자유지시간(분) */
  userSessionMinute: z.number().int(),
});
