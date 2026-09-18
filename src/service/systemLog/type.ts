import { z } from 'zod';
import { pagingParamsSchema } from '@/service/common';

/**
 * 로그는 하루치씩 본다 — `targetDate` 는 비울 수 없다.
 * (명세는 조회 조건 객체와 같은 이름의 평평한 파라미터를 함께 적고 있으나, 실리는 것은 하나다.)
 */
export type SysLogPageParams = z.infer<typeof sysLogPageParamsSchema>;
export const sysLogPageParamsSchema = pagingParamsSchema.extend({
  /** yyyy-MM-dd */
  targetDate: z.string(),
});

export type SysLogDetail = z.infer<typeof sysLogDetailSchema>;
export const sysLogDetailSchema = z.object({
  seq: z.number().int(),
  /** 수집일자 */
  gathDtm: z.string(),
  /** 요청한 사람의 로그인 ID */
  requestUserId: z.string(),
  requestUserName: z.string(),
  clientIp: z.string(),
  requestUrl: z.string(),
  logText: z.string(),
  /** 수행 함수 — `save()` 처럼 온다 */
  operation: z.string(),
  httpMethod: z.string(),
});
