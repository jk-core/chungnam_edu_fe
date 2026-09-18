import { z } from 'zod';

/** 홈 출력 차트의 한 점 */
export type HomeFlowChartPoint = z.infer<typeof homeFlowChartPointSchema>;
export const homeFlowChartPointSchema = z.object({
  dateTime: z.string(),
  /** 출력 (kW). 미수집이면 null */
  currentPower: z.number().nullable(),
});

/** 홈 상단 발전 현황 */
export type HomeHero = z.infer<typeof homeHeroSchema>;
export const homeHeroSchema = z.object({
  /** 금일 발전량 (kWh) */
  dayPower: z.number(),
  /** 현재 출력률 (%) */
  outputRate: z.number(),
  flowChartData: z.array(homeFlowChartPointSchema),
  /** 충남 평균 일출시간 */
  sunriseTime: z.string(),
  /** 충남 평균 일몰시간 */
  sunsetTime: z.string(),
});

/** 홈 발전 현황 요약 */
export type HomeOverview = z.infer<typeof homeOverviewSchema>;
export const homeOverviewSchema = z.object({
  /** 총 설비용량 (kW) */
  totalCapacity: z.number(),
  /** 금일 발전량 (kWh) */
  currentPower: z.number(),
  /** 전일 동시간대 발전량 (kWh) */
  previousPower: z.number(),
  /** 금일 발전시간 (h) */
  currentPowerTime: z.number(),
});

/** 전국 시도별 발전시간 */
export type HomeRegion = z.infer<typeof homeRegionSchema>;
export const homeRegionSchema = z.object({
  cityCode: z.string(),
  cityName: z.string(),
  /** 발전시간 (h) */
  powerTime: z.number(),
});
