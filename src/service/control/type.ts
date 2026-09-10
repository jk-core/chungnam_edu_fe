import { z } from 'zod';
import { ZodFaultCode, ZodStatusCode } from '@/configs/codes';

/** 상황판 전체가 같은 조건을 본다 — 판마다 다른 조건을 두면 판끼리 수가 어긋난다 */
export type ControlFilterParams = z.infer<typeof controlFilterParamsSchema>;
export const controlFilterParamsSchema = z.object({
  regionCode: z.string().optional(),
  powerPlantType: z.string().optional(),
  statusCode: ZodStatusCode.CODE.optional(),
  /** 발전소명·주소 검색어 */
  keyword: z.string().optional(),
});

/**
 * 상황판 머리와 게이지·발전실적 판이 함께 본다. 도 전체를 서버가 집계해 준다.
 *
 * 발전시간을 네 기간 모두 서버가 준다 — 발전량 ÷ 설비용량으로 화면이 나눠도 되지만 누적만은
 * 그럴 수 없다. 설비가 해마다 늘어 온 값이라 지금 용량으로 나누면 실제보다 짧게 나온다.
 */
export type ControlOverview = z.infer<typeof controlOverviewSchema>;
export const controlOverviewSchema = z.object({
  powerPlantCount: z.number().int(),
  totalCapacity: z.number(),
  currentOutput: z.number(),
  averageCapacityFactor: z.number(),
  currentDayPower: z.number(),
  previousDayPower: z.number(),
  currentDayPowerTime: z.number(),
  currentMonthPower: z.number(),
  previousMonthPower: z.number(),
  currentMonthPowerTime: z.number(),
  currentYearPower: z.number(),
  previousYearPower: z.number(),
  currentYearPowerTime: z.number(),
  totalPower: z.number(),
  totalPowerTime: z.number(),
});

/**
 * 시군구 열다섯을 한 줄씩 준다. 지역별 발전시간 판과 AI 진단 브리핑이 같은 배열을 본다 —
 * 브리핑이 「어느 발전소가 가장 나쁜지」를 한 문장으로 읽으므로 그 한 곳을 함께 싣는다.
 *
 * 관내 평균 발전시간은 여기서 주지 않는다. 지역 평균이 아니라 도 전체 발전량을 도 전체 용량으로
 * 나눈 값이라 `/control/overview` 의 currentDayPowerTime 이 그것이다.
 */
export type ControlRegion = z.infer<typeof controlRegionSchema>;
export const controlRegionSchema = z.object({
  regionCode: z.string(),
  regionName: z.string(),
  powerPlantCount: z.number().int(),
  totalCapacity: z.number(),
  currentOutput: z.number(),
  currentDayPower: z.number(),
  currentDayPowerTime: z.number(),
  countAbnormal: z.number().int(),
  /** 이상이 없으면 null */
  worstPowerPlantName: z.string().nullable(),
  worstStatusCode: ZodStatusCode.CODE.nullable(),
  worstStatusName: ZodStatusCode.NAME.nullable(),
  worstFaultCodeName: z.string().nullable(),
});

/**
 * 발전 현황 집계 표. 무엇으로 묶을지는 판 머리의 고르개가 정한다.
 * basis=powerPlant 일 때만 statusCode 가 채워진다 — 묶음에는 상태가 하나로 정해지지 않는다.
 */
export type ControlAggregationParams = z.infer<typeof controlAggregationParamsSchema>;
export const controlAggregationParamsSchema = controlFilterParamsSchema.extend({
  basis: z.enum(['powerPlant', 'type', 'region']),
});

export type ControlAggregation = z.infer<typeof controlAggregationSchema>;
export const controlAggregationSchema = z.object({
  /** powerPlant 면 발전소ID */
  key: z.string(),
  name: z.string(),
  powerPlantCount: z.number().int(),
  totalCapacity: z.number(),
  currentOutput: z.number(),
  currentDayPower: z.number(),
  countAbnormal: z.number().int(),
  statusCode: ZodStatusCode.CODE.nullable(),
  statusName: ZodStatusCode.NAME.nullable(),
});

/**
 * 장애 발생 현황. 이상 발전소를 상태별로 묶어 주고 묶음마다 대표 원인을 한 줄 붙인다 —
 * 통신이 끊긴 곳은 값이 없어 판정할 수 없으므로 null 이다.
 *
 * 상태별 개수는 조건에 걸린 전체를 센다. 이상이 아닌 상태도 0 으로 내려주어 화면이
 * 「몇 곳 가운데 몇 곳」을 그릴 수 있게 한다.
 */
export type ControlFault = z.infer<typeof controlFaultSchema>;
export const controlFaultSchema = z.object({
  countTotal: z.number().int(),
  /*
    필드명은 발전이 저하·이상·정지했다는 조건을 말하고, 표기는 주의·경고·통신단절이다.
    이름은 사내 count 객체 관례를 따르므로 라벨과 갈려도 그대로 둔다.
  */
  countNormal: z.number().int(),
  countReady: z.number().int(),
  countPowerLow: z.number().int(),
  countPowerError: z.number().int(),
  countPowerOff: z.number().int(),
  groupList: z.array(z.object({
    statusCode: ZodStatusCode.CODE,
    statusName: ZodStatusCode.NAME,
    powerPlantCount: z.number().int(),
    /** 판정불가면 null */
    faultCode: ZodFaultCode.nullable(),
    faultCodeName: z.string().nullable(),
    faultCodeCount: z.number().int(),
    list: z.array(z.object({
      powerPlantId: z.number().int(),
      powerPlantName: z.string(),
      regionName: z.string(),
      powerPlantCapacity: z.number(),
      lastGathDtm: z.string().nullable(),
    })),
  })),
});
