import { z } from 'zod';
import apiClient from '@/service';
import { checked } from '@/service/validate';
import { homeHeroSchema, homeOverviewSchema, homeRegionSchema } from './type';

/** 홈 상단 — 금일 발전량·출력률·시간대별 차트·일출·일몰 */
export const getHomeHero = async () => {
  const { data } = await apiClient.get<unknown>('/home/hero');

  return checked(homeHeroSchema, data, 'GET /home/hero');
};

/** 홈 요약 — 설비용량·금일/전일 발전량·금일 발전시간 */
export const getHomeOverview = async () => {
  const { data } = await apiClient.get<unknown>('/home/overview');

  return checked(homeOverviewSchema, data, 'GET /home/overview');
};

/** 전국 시도별 평균 발전시간 (REMS 지역코드 ↔ 시도 조인) */
export const getHomeRegionList = async () => {
  const { data } = await apiClient.get<unknown>('/home/region');

  return checked(z.array(homeRegionSchema), data, 'GET /home/region');
};
