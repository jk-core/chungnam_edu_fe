import { z } from 'zod';

/**
 * 날짜 선택 달력(일) 칸의 날씨.
 * 기준일을 받지 않는다 — 요청일로부터 365일 전까지를 한 번에 준다.
 */
export type CalendarDayParams = z.infer<typeof calendarDayParamsSchema>;
export const calendarDayParamsSchema = z.object({
  powerPlantId: z.number().int().optional(),
});

export type CalendarDay = z.infer<typeof calendarDaySchema>;
export const calendarDaySchema = z.object({
  dateTime: z.string(),
  weatherCode: z.number().int(),
  weatherName: z.string(),
});

/**
 * 날짜 선택 달력(월·연) 칸.
 * 기준일을 받지 않는다 — 요청일로부터 12개월 전까지를 한 번에 준다.
 */
export type CalendarMonthParams = z.infer<typeof calendarMonthParamsSchema>;
export const calendarMonthParamsSchema = z.object({
  powerPlantId: z.number().int().optional(),
});

export type CalendarMonth = z.infer<typeof calendarMonthSchema>;
export const calendarMonthSchema = z.object({
  /** 해당월 1일 */
  dateTime: z.string(),
  powerTime: z.number(),
});
