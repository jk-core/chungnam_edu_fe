import apiClient from '@/service';
import type { HomeHero, HomeOverview, HomeRegion } from './type';

/** 홈 API */
export const getHomeHero = async () => {
  const { data } = await apiClient.get<HomeHero>('/home/hero');

  return data;
};

export const getHomeOverview = async () => {
  const { data } = await apiClient.get<HomeOverview>('/home/overview');

  return data;
};

export const getHomeRegion = async () => {
  const { data } = await apiClient.get<HomeRegion[]>('/home/region');

  return data;
};
