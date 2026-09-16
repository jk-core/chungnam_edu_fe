import apiClient from '@/service';
import type { CalendarDay, CalendarMonth } from './type';

/** 날짜 선택 달력 API */
export const getCalendarMonthList = async (powerPlantId: number) => {
  const { data } = await apiClient.get<CalendarMonth[]>('/calendar/month', { params: { powerPlantId } });

  return data;
};

export const getCalendarDayList = async (powerPlantId: number) => {
  const { data } = await apiClient.get<CalendarDay[]>('/calendar/day', { params: { powerPlantId } });

  return data;
};
