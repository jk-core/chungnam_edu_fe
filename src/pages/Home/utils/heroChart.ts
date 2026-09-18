import type { HomeFlowChartPoint } from '@/service/home/type';

/** Date → 소수 시간 (시 + 분/60 + 초/3600) */
export function hourOfDate(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

/** `2026-09-17 14:00:00` / ISO 문자열을 소수 시간으로 바꾼다 */
export function hourOfDateTime(value: string): number {
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return 0;

  return hourOfDate(date);
}

/** 차트 점을 막대용 `{ hour, kw }` 로 바꾼다. null 출력은 0으로 둔다. */
export function barsFromFlowChart(points: HomeFlowChartPoint[]): { hour: number; kw: number }[] {
  return points.map((point) => ({
    hour: hourOfDateTime(point.dateTime),
    kw: point.currentPower ?? 0,
  }));
}
