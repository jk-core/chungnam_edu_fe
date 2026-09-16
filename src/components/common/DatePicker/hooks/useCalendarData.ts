import { useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { getCalendarDayList, getCalendarMonthList } from '@/service/calendar';
import { queryKeys } from '@/service/queryKeys';
import { serverIdOf } from '@/configs/scope';
import { usePlantScope } from '@/hooks/usePlantScope';
import { weatherKindFromCode } from '@/mocks/weather';
import type { CalendarDayCell, MonthPower } from '@/interface/weather';

/**
 * 날짜 선택 달력이 칸에 얹는 값 (`/calendar/day` · `/calendar/month`).
 *
 * 두 조회 모두 발전소만 받고 기간은 받지 않는다 — 서버가 정한 창만큼 오므로, 굴려서 그 밖으로
 * 나가면 칸이 빈다. 기간 파라미터가 생기면 여기서 조회 단위와 함께 실어 보낸다.
 */
export function useCalendarData() {
  const { plant } = usePlantScope();
  const powerPlantId = plant ? serverIdOf(plant.id, 'p') : null;

  const { data: dayList } = useQuery({
    queryKey: queryKeys.calendar.day(powerPlantId),
    queryFn: () => getCalendarDayList(powerPlantId ?? 0),
    enabled: powerPlantId !== null,
  });

  const { data: monthList } = useQuery({
    queryKey: queryKeys.calendar.month(powerPlantId),
    queryFn: () => getCalendarMonthList(powerPlantId ?? 0),
    enabled: powerPlantId !== null,
  });

  const days = useMemo<CalendarDayCell[]>(
    () => dayList?.map((row) => ({
      date: row.dateTime,
      kind: weatherKindFromCode(row.weatherCode),
      label: row.weatherName,
    })) ?? [],
    [dayList],
  );

  const months = useMemo<MonthPower[]>(
    () => monthList?.map((row) => ({
      month: dayjs(row.dateTime).format('YYYY-MM'),
      generationHours: row.powerTime,
    })) ?? [],
    [monthList],
  );

  // 달력은 굴리는 달·해마다 물어 온다. 받아 둔 창에서 그 구간만 잘라 준다.
  const getDays = useCallback(
    (year: number, month: number) => {
      const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;

      return days.filter((day) => day.date.startsWith(prefix));
    },
    [days],
  );

  const getMonths = useCallback(
    (year: number) => months.filter((item) => item.month.startsWith(String(year))),
    [months],
  );

  return { getDays, getMonths };
}
