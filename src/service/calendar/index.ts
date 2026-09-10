import apiClient from '@/service';
import type { CalendarDay, CalendarDayParams, CalendarMonth, CalendarMonthParams } from './type';

/** 날짜 선택 달력 API */
export const getCalendarDay = async (params: CalendarDayParams) => {
  const { data } = await apiClient.get<CalendarDay[]>('/calendar/day', { params });

  return data;
};

export const getCalendarMonth = async (params: CalendarMonthParams) => {
  const { data } = await apiClient.get<CalendarMonth[]>('/calendar/month', { params });

  return data;
};
