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
 * 표와 같은 열이다. 다만 단상·삼상 열을 모두 고정으로 깔아, 위상이 다른 설비끼리도 파일을
 * 겹쳐 볼 수 있게 한다.
 */
export type OperationHistoryExcelParams = z.infer<typeof operationHistoryExcelParamsSchema>;
export const operationHistoryExcelParamsSchema = z.object({
  cid: z.number().int(),
  targetDate: z.string(),
});
