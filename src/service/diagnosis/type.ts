import { z } from 'zod';
import { ZodFaultCode, ZodStatusCode } from '@/configs/codes';

/** 발전소로 여는 조회 조건 한 벌 */
export type DiagnosisPowerPlantParams = z.infer<typeof diagnosisPowerPlantParamsSchema>;
export const diagnosisPowerPlantParamsSchema = z.object({
  powerPlantId: z.number().int(),
  startDate: z.string(),
  endDate: z.string(),
});

/** 설비로 여는 조회 조건 한 벌 */
export type DiagnosisInverterParams = z.infer<typeof diagnosisInverterParamsSchema>;
export const diagnosisInverterParamsSchema = z.object({
  cid: z.number().int(),
  startDate: z.string(),
  endDate: z.string(),
});

/** 스트링으로 여는 조회 조건 한 벌 */
export type DiagnosisStringParams = z.infer<typeof diagnosisStringParamsSchema>;
export const diagnosisStringParamsSchema = z.object({
  stringId: z.number().int(),
  startDate: z.string(),
  endDate: z.string(),
});

/** 카드의 진단 효율 스파크라인. 미수집이면 null 이다 */
const diagnosisFlowChartDataSchema = z.array(z.object({
  dateTime: z.string(),
  diagEfficiency: z.number().nullable(),
}));

/**
 * 발전소 아래 인버터 카드 목록. 카드·표 두 보기가 같은 응답을 본다.
 * efficiency·faultCode 는 기간 마지막 날 값이고, predictedPower·currentPower 는 기간 합계다.
 */
export type DiagnosisPowerPlantInverter = z.infer<typeof diagnosisPowerPlantInverterSchema>;
export const diagnosisPowerPlantInverterSchema = z.object({
  cid: z.number().int(),
  equipmentName: z.string(),
  equipmentCapacity: z.number(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  diagEfficiency: z.number(),
  predictedPower: z.number(),
  currentPower: z.number(),
  /** 정상이면 null */
  faultCode: ZodFaultCode.nullable(),
  faultCodeName: z.string().nullable(),
  countBelow: z.number().int(),
  flowChartData: diagnosisFlowChartDataSchema,
});

/** 인버터 아래 스트링 카드 목록. 모양은 인버터 목록과 같고 식별자만 스트링 것이다 */
export type DiagnosisInverterString = z.infer<typeof diagnosisInverterStringSchema>;
export const diagnosisInverterStringSchema = z.object({
  stringId: z.number().int(),
  stringName: z.string(),
  stringCapacity: z.number(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  diagEfficiency: z.number(),
  predictedPower: z.number(),
  currentPower: z.number(),
  faultCode: ZodFaultCode.nullable(),
  faultCodeName: z.string().nullable(),
  countBelow: z.number().int(),
  flowChartData: diagnosisFlowChartDataSchema,
});

/**
 * 일자별 진단 효율 한 줄. 표는 칸 색을 그날 고장코드가 정하므로 일자마다 고장코드가 붙는다.
 * 계측이 없는 날은 null 이다 — 0 으로 내리면 실제로 0% 를 낸 날처럼 읽힌다.
 */
const dailyEfficiencySchema = z.array(z.object({
  dateTime: z.string(),
  diagEfficiency: z.number().nullable(),
  /** 0이면 정상 */
  faultCode: ZodFaultCode,
  faultCodeName: z.string(),
}));

export type DiagnosisInverterStringEfficiency = z.infer<typeof diagnosisInverterStringEfficiencySchema>;
export const diagnosisInverterStringEfficiencySchema = z.object({
  stringId: z.number().int(),
  stringName: z.string(),
  stringCapacity: z.number(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  dailyList: dailyEfficiencySchema,
});

/** 인버터 행을 펼치면 그 아래 스트링이 나오므로 stringList 를 한 겹 품는다 */
export type DiagnosisPowerPlantInverterEfficiency = z.infer<typeof diagnosisPowerPlantInverterEfficiencySchema>;
export const diagnosisPowerPlantInverterEfficiencySchema = z.object({
  cid: z.number().int(),
  equipmentName: z.string(),
  equipmentCapacity: z.number(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  dailyList: dailyEfficiencySchema,
  stringList: z.array(diagnosisInverterStringEfficiencySchema),
});

/**
 * 전력·전압·전류 한 시점. 화면이 셋을 토글로 갈아 끼우므로 한 응답에 셋을 함께 담는다.
 *
 * 요약·상세는 프론트가 가른다 — 서버는 늘 정시 전부를 주고, 요약일 때 화면이 일별 최고점만
 * 남긴다. `pv*Phys`(물리모델)·`pv*Ml`(ML) 예측 계열도 늘 실려 오고 상세에서만 얹는다.
 * 계측이 없는 시점은 null 이다 — 0 으로 내리면 통신단절이 「정상범위 이탈」로 읽힌다.
 */
const diagnosisRawRowSchema = z.object({
  gathDtm: z.string(),
  pvPwr: z.number().nullable(),
  pvPwrNormalUpper: z.number(),
  pvPwrNormalLower: z.number(),
  pvPwrPhys: z.number(),
  pvPwrMl: z.number(),
  pvVlt: z.number().nullable(),
  pvVltNormalUpper: z.number(),
  pvVltNormalLower: z.number(),
  pvVltPhys: z.number(),
  pvVltMl: z.number(),
  pvCur: z.number().nullable(),
  pvCurNormalUpper: z.number(),
  pvCurNormalLower: z.number(),
  pvCurPhys: z.number(),
  pvCurMl: z.number(),
  irrad: z.number().nullable(),
  faultCode: ZodFaultCode,
  faultCodeName: z.string(),
});

export type DiagnosisInverterRaw = z.infer<typeof diagnosisInverterRawSchema>;
export const diagnosisInverterRawSchema = z.object({
  cid: z.number().int(),
  equipmentName: z.string(),
  countOutOfRange: z.number().int(),
  list: z.array(diagnosisRawRowSchema),
});

export type DiagnosisStringRaw = z.infer<typeof diagnosisStringRawSchema>;
export const diagnosisStringRawSchema = z.object({
  stringId: z.number().int(),
  stringName: z.string(),
  countOutOfRange: z.number().int(),
  list: z.array(diagnosisRawRowSchema),
});
