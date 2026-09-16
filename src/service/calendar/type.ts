import { z } from 'zod';
import { ZodWeatherCode } from '@/configs/codes';

/** 월별 발전시간. `dateTime` 은 그 달 1일이다 */
export type CalendarMonth = z.infer<typeof calendarMonthSchema>;
export const calendarMonthSchema = z.object({
  dateTime: z.string(),
  /** 월 누적 발전시간(h) */
  powerTime: z.number(),
});

/** 일별 날씨 — 선택 발전소가 위치한 지역 기준이다 */
export type CalendarDay = z.infer<typeof calendarDaySchema>;
export const calendarDaySchema = z.object({
  dateTime: z.string(),
  weatherCode: ZodWeatherCode.CODE,
  weatherName: ZodWeatherCode.NAME,
});
