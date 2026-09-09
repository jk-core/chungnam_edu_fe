import { z } from 'zod';
import { ZodStatusCode } from '@/configs/codes';

/** 조회단위 — 일·월·연 */
export type DateMode = z.infer<typeof dateModeSchema>;
export const dateModeSchema = z.enum(['day', 'month', 'year']);

/** 발전소로 여는 조회 조건 한 벌 */
export type StatisticsPowerPlantParams = z.infer<typeof statisticsPowerPlantParamsSchema>;
export const statisticsPowerPlantParamsSchema = z.object({
  powerPlantId: z.number().int(),
  targetDate: z.string(),
  dateMode: dateModeSchema,
});

/** 설비로 여는 조회 조건 한 벌 */
export type StatisticsInverterParams = z.infer<typeof statisticsInverterParamsSchema>;
export const statisticsInverterParamsSchema = z.object({
  cid: z.number().int(),
  targetDate: z.string(),
  dateMode: dateModeSchema,
});

export type StatisticsPowerPlantOverview = z.infer<typeof statisticsPowerPlantOverviewSchema>;
export const statisticsPowerPlantOverviewSchema = z.object({
  powerPlantCapacity: z.number(),
  currentPower: z.number(),
  previousPower: z.number(),
  /** 발전효율 (실측÷기대) */
  powerEfficiency: z.number(),
  currentPowerTime: z.number(),
  previousPowerTime: z.number(),
});

export type StatisticsInverterOverview = z.infer<typeof statisticsInverterOverviewSchema>;
export const statisticsInverterOverviewSchema = z.object({
  equipmentCapacity: z.number(),
  currentPower: z.number(),
  previousPower: z.number(),
  powerEfficiency: z.number(),
  currentPowerTime: z.number(),
  previousPowerTime: z.number(),
});

/**
 * 발전량·일사강도 추이. 발전소와 설비가 지금은 같은 모양이지만 경로를 가르므로 타입도 가른다 —
 * 나중에 한쪽에만 필드가 붙을 때 다른 쪽이 흔들리지 않는다.
 */
export type StatisticsPowerPlantChart = z.infer<typeof statisticsPowerPlantChartSchema>;
export const statisticsPowerPlantChartSchema = z.object({
  /** day=시각, month=일, year=월 */
  dateTime: z.string(),
  currentPower: z.number().nullable(),
  previousPower: z.number().nullable(),
  irrad: z.number().nullable(),
});

export type StatisticsInverterChart = z.infer<typeof statisticsInverterChartSchema>;
export const statisticsInverterChartSchema = z.object({
  dateTime: z.string(),
  currentPower: z.number().nullable(),
  previousPower: z.number().nullable(),
  irrad: z.number().nullable(),
});

const flowChartDataSchema = z.array(z.object({
  dateTime: z.string(),
  currentPower: z.number().nullable(),
}));

/** 카드마다 그 기간의 발전 곡선을 함께 담는다. 카드를 누르면 그 설비로 한 단계 내려간다 */
export type StatisticsPowerPlantInverter = z.infer<typeof statisticsPowerPlantInverterSchema>;
export const statisticsPowerPlantInverterSchema = z.object({
  cid: z.number().int(),
  equipmentName: z.string(),
  equipmentCapacity: z.number(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  currentPower: z.number(),
  powerEfficiency: z.number(),
  powerTime: z.number(),
  flowChartData: flowChartDataSchema,
});

export type StatisticsInverterString = z.infer<typeof statisticsInverterStringSchema>;
export const statisticsInverterStringSchema = z.object({
  stringId: z.number().int(),
  stringName: z.string(),
  stringCapacity: z.number(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  currentPower: z.number(),
  powerEfficiency: z.number(),
  powerTime: z.number(),
  flowChartData: flowChartDataSchema,
});

/** 조회 대상과 무관하게 도 전체를 센다 */
export type StatisticsBasisParams = z.infer<typeof statisticsBasisParamsSchema>;
export const statisticsBasisParamsSchema = z.object({
  /** 집계기준 */
  basis: z.enum(['device', 'region', 'office']),
  targetDate: z.string(),
  dateMode: dateModeSchema,
});

export type StatisticsBasis = z.infer<typeof statisticsBasisSchema>;
export const statisticsBasisSchema = z.object({
  key: z.string(),
  /** 시군구 15개 / 교육지원청 14개 */
  name: z.string(),
  powerPlantCount: z.number().int(),
  totalCapacity: z.number(),
  currentPower: z.number(),
  capacityFactor: z.number(),
});
