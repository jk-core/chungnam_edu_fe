import { z } from 'zod';
import { ZodStatusCode } from '@/configs/codes';
import { pagingParamsSchema } from '@/service/common';

/** 요약 카드와 목록이 같은 조건을 본다 */
export type ManageDataQualityParams = z.infer<typeof manageDataQualityParamsSchema>;
export const manageDataQualityParamsSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

/**
 * 기간 전체 품질 요약.
 *
 * 품질률을 비율로 내려주지 않는다 — 카드가 유효건수·기대건수와 함께 서고 표도 같은 분수를
 * 적는다. 프론트가 나눠 써야 두 자리의 반올림이 어긋나지 않는다.
 * 기준 미달로 볼 품질률도 프론트가 정한다 — 임계값을 응답에 싣지 않는다.
 *
 * 품질률은 수집률과 다르다 — 수집률은 값이 들어왔는지만 보고, 품질률은 들어온 값이 정상
 * 판정을 받았는지까지 본다. validCount 는 dataStateCode 가 정상으로 들어온 건수다.
 */
export type ManageDataQualityOverview = z.infer<typeof manageDataQualityOverviewSchema>;
export const manageDataQualityOverviewSchema = z.object({
  totalCount: z.number().int(),
  validCount: z.number().int(),
  countBelow: z.number().int(),
});

/** 품질률 오름차순으로 정렬해 준다 — 나쁜 것이 먼저 보여야 하는 표라 정렬을 화면이 고르지 않는다 */
export type ManageDataQualityPageParams = z.infer<typeof manageDataQualityPageParamsSchema>;
export const manageDataQualityPageParamsSchema = manageDataQualityParamsSchema.extend(pagingParamsSchema.shape);

export type ManageDataQualityPage = z.infer<typeof manageDataQualityPageSchema>;
export const manageDataQualityPageSchema = z.object({
  powerPlantId: z.number().int(),
  powerPlantName: z.string(),
  regionName: z.string(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  totalCount: z.number().int(),
  validCount: z.number().int(),
});
