import { z } from 'zod';

/** 통합관제 수집 현황 표 */
export type CollectStatusParams = z.infer<typeof collectStatusParamsSchema>;
export const collectStatusParamsSchema = z.object({
  targetDate: z.string(),
});

export type CollectStatus = z.infer<typeof collectStatusSchema>;
export const collectStatusSchema = z.object({
  lastGathDtm: z.string(),
  /** 미수신개소 */
  countStale: z.number().int(),
  /** 품질기준미달개소 */
  countBelow: z.number().int(),
  list: z.array(z.object({
    powerPlantId: z.number().int(),
    powerPlantName: z.string(),
    regionName: z.string(),
    collectRate: z.number(),
    missingCount: z.number().int(),
    expectCount: z.number().int(),
    lastGathDtm: z.string(),
    /** 수집지연(분) */
    delayMinute: z.number(),
  })),
});
