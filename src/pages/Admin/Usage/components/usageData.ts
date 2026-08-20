import { getLoginTrend, getMenuUsage } from '@/mocks/security';
import type { MenuUsage } from '@/interface/security';

/** 활용 통계가 보는 기간 (SFR-028) — 화면 문구도 이 값을 그대로 쓴다 */
export const TREND_DAYS = 30;

/** 막대와 표에 세우는 상위 개수 */
export const TOP_COUNT = 10;

/** 조회수 순으로 세운 메뉴별 활용 (SFR-028) */
export const readMenuUsage = () => getMenuUsage();

/** 최근 기간의 일별 로그인 (SFR-028) */
export const readLoginTrend = () => getLoginTrend(TREND_DAYS);

/** 전체 조회수 대비 비중(%) — 표와 내려받기가 같은 셈을 쓴다 */
export function shareOf(row: MenuUsage, totalViews: number): number {
  return totalViews > 0 ? (row.views / totalViews) * 100 : 0;
}

export const sumViews = (rows: MenuUsage[]) => rows.reduce((sum, row) => sum + row.views, 0);
