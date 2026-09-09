import { z } from 'zod';
import { pagingParamsSchema } from '@/service/common';

/**
 * 기간별 전송 성공률 카드 셋과, 아직 풀리지 않은 실패 건수.
 *
 * 성공률을 비율로 내려주지 않는다 — 카드가 「98.3% · 1,182 / 1,203건 성공」처럼 분수를 함께
 * 적어, 비율을 따로 받으면 반올림 때문에 분수와 어긋난다. 프론트가 나눈다.
 * 재송신으로 회복된 건은 성공으로 센다 — 목록·차트도 같은 셈을 써야 화면 값이 갈리지 않는다.
 *
 * unresolvedFailCount 는 목록 필터와 무관한 전체 실패 건수다 — 「실패 N건 일괄 재송신」 단추가
 * 그 수를 적고, 0 이면 눌리지 않는다.
 */
export type ManageIntegrationOverview = z.infer<typeof manageIntegrationOverviewSchema>;
export const manageIntegrationOverviewSchema = z.object({
  dayTotalCount: z.number().int(),
  daySuccessCount: z.number().int(),
  weekTotalCount: z.number().int(),
  weekSuccessCount: z.number().int(),
  monthTotalCount: z.number().int(),
  monthSuccessCount: z.number().int(),
  unresolvedFailCount: z.number().int(),
});

/**
 * 최근 30일 일자별 전송 성공률 막대.
 *
 * 전송이 한 건도 없던 날은 두 값 모두 0 으로 준다 — 비율을 대신 내려주면 「보낸 적 없음」과
 * 「전부 실패」가 같은 0 이 되거나, 반대로 1 로 채워 100% 였던 것처럼 읽힌다.
 */
export type ManageIntegrationChart = z.infer<typeof manageIntegrationChartSchema>;
export const manageIntegrationChartSchema = z.object({
  dateTime: z.string(),
  totalCount: z.number().int(),
  successCount: z.number().int(),
});

export type ManageIntegrationPageParams = z.infer<typeof manageIntegrationPageParamsSchema>;
export const manageIntegrationPageParamsSchema = pagingParamsSchema.extend({
  /** 비우면 전체 */
  resultCode: z.number().int().optional(),
});

/** 성공·재시도 성공 건은 failReason 이 null 이다 */
export type ManageIntegrationPage = z.infer<typeof manageIntegrationPageSchema>;
export const manageIntegrationPageSchema = z.object({
  integrationId: z.number().int(),
  sendDtm: z.string(),
  targetName: z.string(),
  rowCount: z.number().int(),
  resultCode: z.number().int(),
  resultName: z.string(),
  responseCode: z.number().int(),
  /** 응답지연(ms) */
  latencyMs: z.number(),
  failReason: z.string().nullable(),
});

/**
 * 실패 건 재송신. 행 하나를 보내는 것과 실패 전체를 한꺼번에 보내는 것이 같은 요청이다 —
 * 배열 길이만 다르다.
 *
 * 재송신에 성공하면 그 건의 결과가 「재시도 성공」으로 바뀌고 응답코드·실패사유도 함께
 * 갱신된다. 프론트가 화면에서 고쳐 그리지 않고 목록을 다시 받는다.
 */
export type ManageIntegrationResendParams = z.infer<typeof manageIntegrationResendSchema>;
export const manageIntegrationResendSchema = z.object({
  integrationIdList: z.array(z.number().int()),
});
