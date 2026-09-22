import { z } from 'zod';
import { ZodFaultCode, ZodStatusCode } from '@/configs/codes';

/*
  AI 진단 (SFR-011 · SFR-013 · SFR-014).

  조회 대상마다 경로가 갈리고, 파라미터는 어느 쪽이든 「식별자 + 조회 기간」 한 벌이다.
  효율 시계열의 값 이름이 대상마다 갈린다 — 발전소는 `diagEfficiency`, 인버터·스트링은
  `efficiency` 다. 같은 뜻이지만 계약이 그러하므로 읽는 자리에서 맞춘다.
*/

export type DiagnosisPowerPlantParams = z.infer<typeof diagnosisPowerPlantParamsSchema>;
export const diagnosisPowerPlantParamsSchema = z.object({
  powerPlantId: z.number().int(),
  startDate: z.string(),
  endDate: z.string(),
});

export type DiagnosisInverterParams = z.infer<typeof diagnosisInverterParamsSchema>;
export const diagnosisInverterParamsSchema = z.object({
  cid: z.number().int(),
  startDate: z.string(),
  endDate: z.string(),
});

export type DiagnosisStringParams = z.infer<typeof diagnosisStringParamsSchema>;
export const diagnosisStringParamsSchema = z.object({
  stringId: z.number().int(),
  startDate: z.string(),
  endDate: z.string(),
});

/** 카드의 스파크라인이 쓰는 한 점 */
export type DailySimpleEfficiency = z.infer<typeof dailySimpleEfficiencySchema>;
export const dailySimpleEfficiencySchema = z.object({
  dateTime: z.string(),
  efficiency: z.number(),
});

/** 일자별 효율 표의 한 칸. 칸 색은 `faultCode` 를 따른다 */
export type DailyEfficiency = z.infer<typeof dailyEfficiencySchema>;
export const dailyEfficiencySchema = z.object({
  dateTime: z.string(),
  efficiency: z.number(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  faultCode: ZodFaultCode,
  faultCodeName: z.string(),
});

/** 발전소 조회일 때의 일자별 효율 — 상태 없이 효율 이름만 갈린다 */
export type DailyDiagEfficiency = z.infer<typeof dailyDiagEfficiencySchema>;
export const dailyDiagEfficiencySchema = z.object({
  dateTime: z.string(),
  diagEfficiency: z.number(),
  faultCode: ZodFaultCode,
  faultCodeName: z.string(),
});

/* ── 설비별 진단 현황 (카드/표) ──────────────────────────── */

/** `/diagnosis/powerPlant/inverter/list` — 발전소 아래 인버터 한 대 */
export type DiagnosisInverterRow = z.infer<typeof diagnosisInverterRowSchema>;
export const diagnosisInverterRowSchema = z.object({
  cid: z.number().int(),
  equipmentName: z.string(),
  equipmentCapacity: z.number(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  /** 최신일 효율 (%) */
  diagEfficiency: z.number(),
  /** 최신일 측정 발전량 (kWh) */
  currentPower: z.number(),
  /** 최신일 기대 발전량 (kWh) */
  predictedPower: z.number(),
  countBelow: z.number().int(),
  faultCode: ZodFaultCode,
  faultCodeName: z.string(),
  flowChartData: z.array(dailySimpleEfficiencySchema),
});

/**
 * `/diagnosis/inverter/string/list` — 인버터 아래 스트링 한 조.
 * 측정·기대 발전량은 스트링에 없다 — 그 계층에서는 재지 않는 값이라 화면도 그 칸을 세우지 않는다.
 */
export type DiagnosisStringRow = z.infer<typeof diagnosisStringRowSchema>;
export const diagnosisStringRowSchema = z.object({
  stringId: z.number().int(),
  stringName: z.string(),
  stringCapacity: z.number(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  countBelow: z.number().int(),
  faultCode: ZodFaultCode,
  faultCodeName: z.string(),
  flowChartData: z.array(dailySimpleEfficiencySchema),
});

/* ── 일자별 발전효율 (표/차트) ───────────────────────────── */

/** 발전소 조회의 스트링 한 줄 — 표에서 인버터 줄을 펼치면 나온다 */
export type StringEfficiency = z.infer<typeof stringEfficiencySchema>;
export const stringEfficiencySchema = z.object({
  stringId: z.number().int(),
  stringName: z.string(),
  stringCapacity: z.number(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  dailyList: z.array(dailyEfficiencySchema),
});

/**
 * `/diagnosis/powerPlant/efficiency` — 인버터 한 대와 그 아래 스트링까지 한 번에 온다.
 * 표의 펼침이 이 구조를 그대로 쓴다.
 */
export type PowerPlantEfficiency = z.infer<typeof powerPlantEfficiencySchema>;
export const powerPlantEfficiencySchema = z.object({
  cid: z.number().int(),
  equipmentName: z.string(),
  equipmentCapacity: z.number(),
  statusCode: ZodStatusCode.CODE,
  statusName: ZodStatusCode.NAME,
  dailyList: z.array(dailyDiagEfficiencySchema),
  stringList: z.array(stringEfficiencySchema),
});

/** `/diagnosis/inverter/string/efficiency` — 스트링 줄만 온다 */
export type InverterEfficiency = StringEfficiency;

/* ── 수집 raw data (전력·전압·전류 추이) ──────────────────── */

/** 한 수집 시점 — 측정값과 정상범위 상·하한, 물리모델·ML 예측값이 한 줄에 함께 온다 */
export type DiagnosisRawPoint = z.infer<typeof diagnosisRawPointSchema>;
export const diagnosisRawPointSchema = z.object({
  gathDtm: z.string(),
  faultCode: ZodFaultCode,
  faultCodeName: z.string(),
  slpIrrad: z.number(),
  pvPwr: z.number(),
  pvPwrNormalUpper: z.number(),
  pvPwrNormalLower: z.number(),
  pvPwrPhys: z.number(),
  pvPwrMl: z.number(),
  pvCur: z.number(),
  pvCurNormalUpper: z.number(),
  pvCurNormalLower: z.number(),
  pvCurPhys: z.number(),
  pvCurMl: z.number(),
  pvVlt: z.number(),
  pvVltNormalUpper: z.number(),
  pvVltNormalLower: z.number(),
  pvVltPhys: z.number(),
  pvVltMl: z.number(),
});

export type DiagnosisInverterRaw = z.infer<typeof diagnosisInverterRawSchema>;
export const diagnosisInverterRawSchema = z.object({
  cid: z.number().int(),
  equipmentName: z.string(),
  /** 정상범위를 벗어난 일수 */
  outOfRangeDays: z.number().int(),
  list: z.array(diagnosisRawPointSchema),
});

export type DiagnosisStringRaw = z.infer<typeof diagnosisStringRawSchema>;
export const diagnosisStringRawSchema = z.object({
  stringId: z.number().int(),
  stringName: z.string(),
  outOfRangeDays: z.number().int(),
  list: z.array(diagnosisRawPointSchema),
});
