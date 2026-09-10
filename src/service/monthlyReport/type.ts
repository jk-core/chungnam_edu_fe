import { z } from 'zod';
import { ZodFaultCode } from '@/configs/codes';

/**
 * A4 다섯 장을 한 번에 그린다 — 장을 나눠 부르면 인쇄 중에 값이 갈릴 수 있다.
 * 그달 제출된 현장보고서는 `/inspectionReport/list` 를 따로 불러 5장에 싣는다.
 */
export type MonthlyReportParams = z.infer<typeof monthlyReportParamsSchema>;
export const monthlyReportParamsSchema = z.object({
  powerPlantId: z.number().int(),
  /** 그달 1일 */
  targetDate: z.string(),
});

export type MonthlyReport = z.infer<typeof monthlyReportSchema>;
export const monthlyReportSchema = z.object({
  powerPlantName: z.string(),
  address: z.string(),
  powerPlantCapacity: z.number(),
  inverterName: z.string(),
  moduleName: z.string(),
  moduleStructure: z.string(),
  currentPower: z.number(),
  previousPower: z.number(),
  dailyCompareList: z.array(z.object({
    day: z.number().int(),
    currentPower: z.number(),
    previousPower: z.number(),
  })),
  inverterPowerTimeList: z.array(z.object({
    cid: z.number().int(),
    equipmentName: z.string(),
    powerTime: z.number(),
    currentPower: z.number(),
    dailyPowerTime: z.array(z.number()),
  })),
  inverterDiagnosisList: z.array(z.object({
    cid: z.number().int(),
    equipmentName: z.string(),
    normalLower: z.number(),
    normalUpper: z.number(),
    currentValue: z.number(),
    dailyList: z.array(z.object({
      day: z.number().int(),
      normalLower: z.number(),
      normalUpper: z.number(),
      currentValue: z.number(),
      faultCode: ZodFaultCode,
    })),
  })),
  unitDiagnosisList: z.array(z.object({
    nodeId: z.string(),
    nodeName: z.string(),
    parentCid: z.number().int(),
    dailyEfficiency: z.array(z.number()),
  })),
  faultByDayList: z.array(z.object({
    cid: z.number().int(),
    equipmentName: z.string(),
    faultCodes: z.array(ZodFaultCode),
  })),
  recommendList: z.array(z.string()),
  routineGuideList: z.array(z.string()),
});
