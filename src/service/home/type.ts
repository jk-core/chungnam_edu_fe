import { z } from 'zod';

/** 상단 히어로 — 금일 발전량·현재 출력률·시간대별 출력 곡선·일출입 */
export type HomeHero = z.infer<typeof homeHeroSchema>;
export const homeHeroSchema = z.object({
  dayPower: z.number(),
  outputRate: z.number(),
  flowChartData: z.array(z.object({
    dateTime: z.string(),
    /** 미수집이면 null — 일출 전·일몰 후 칸이 0 과 갈린다 */
    currentPower: z.number().nullable(),
  })),
  sunriseTime: z.string(),
  sunsetTime: z.string(),
});

/** 탄소저감량은 프론트가 발전량으로 환산한다 — 배출계수와 환산 대상이 화면 문구다 */
export type HomeOverview = z.infer<typeof homeOverviewSchema>;
export const homeOverviewSchema = z.object({
  totalCapacity: z.number(),
  currentPower: z.number(),
  previousPower: z.number(),
  currentPowerTime: z.number(),
});

/**
 * 전국 시·도 단위다. 관내 발전소 집계가 아니라 외부 계통(REMS) 값이라
 * `/powerPlant/list` 로 못 만든다.
 */
export type HomeRegion = z.infer<typeof homeRegionSchema>;
export const homeRegionSchema = z.object({
  cityCode: z.string(),
  cityName: z.string(),
  powerTime: z.number(),
});
