import { z } from 'zod';
import { ZodDataStateCode } from '@/configs/codes';
import { pagingParamsSchema } from '@/service/common';

/** 결측은 null 로 준다 — 0 과 다른 값이다 */
export type OperationHistoryPageParams = z.infer<typeof operationHistoryPageParamsSchema>;
export const operationHistoryPageParamsSchema = pagingParamsSchema.extend({
  cid: z.number().int(),
  targetDate: z.string(),
});

export type OperationHistoryPage = z.infer<typeof operationHistoryPageSchema>;
export const operationHistoryPageSchema = z.object({
  gathDtm: z.string(),
  dataStateCode: ZodDataStateCode.CODE,
  dataStateName: ZodDataStateCode.NAME,
  accumPower: z.number().nullable(),
  irrad: z.number().nullable(),
  moduleTemp: z.number().nullable(),
  inverterTemp: z.number().nullable(),
  inputVoltageFigure: z.number().nullable(),
  inputCurrentFigure: z.number().nullable(),
  inputPowerFigure: z.number().nullable(),
  outputVoltageFigure: z.number().nullable(),
  outputCurrentFigure: z.number().nullable(),
  sysRPhaseVoltage: z.number().nullable(),
  sysSPhaseVoltage: z.number().nullable(),
  sysTPhaseVoltage: z.number().nullable(),
  sysRPhaseCurrent: z.number().nullable(),
  sysSPhaseCurrent: z.number().nullable(),
  sysTPhaseCurrent: z.number().nullable(),
  outputPowerFigure: z.number().nullable(),
  frequency: z.number().nullable(),
  powerFactorRate: z.number().nullable(),
});

/** 그래프는 하루 전체가 있어야 그려진다. 결측 구간은 null 로 두어 선을 끊는다 */
export type OperationHistoryChartParams = z.infer<typeof operationHistoryChartParamsSchema>;
export const operationHistoryChartParamsSchema = z.object({
  cid: z.number().int(),
  targetDate: z.string(),
});

export type OperationHistoryChart = z.infer<typeof operationHistoryChartSchema>;
export const operationHistoryChartSchema = z.object({
  dateTime: z.string(),
  dataStateCode: ZodDataStateCode.CODE,
  dataStateName: ZodDataStateCode.NAME,
  accumPower: z.number().nullable(),
  outputPowerFigure: z.number().nullable(),
  outputVoltageFigure: z.number().nullable(),
  outputCurrentFigure: z.number().nullable(),
});

/**
 * 파일은 서버가 만든다 — 열 구성도 서버 몫이다.
 * 표는 쪽을 나눠 받지만 파일은 그날 전량이라, 화면이 쥔 줄로 짜맞추면 보이는 쪽만 담긴다.
 */
export type OperationHistoryExcelParams = z.infer<typeof operationHistoryExcelParamsSchema>;
export const operationHistoryExcelParamsSchema = z.object({
  cid: z.number().int(),
  targetDate: z.string(),
});
