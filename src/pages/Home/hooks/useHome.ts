import { useQuery } from '@tanstack/react-query';
import { getHomeHero, getHomeOverview, getHomeRegionList } from '@/service/home';
import { queryKeys } from '@/service/queryKeys';
import { type MapRegion, nationalAverageOf, nationalRankOf, toMapRegions } from '../utils/mapRegions';

const HOME_QUERY = { staleTime: 60_000 } as const;

export function useHomeHero() {
  return useQuery({
    queryKey: queryKeys.home.hero(),
    queryFn: getHomeHero,
    ...HOME_QUERY,
  });
}

export function useHomeOverview() {
  return useQuery({
    queryKey: queryKeys.home.overview(),
    queryFn: getHomeOverview,
    ...HOME_QUERY,
  });
}

export function useHomeRegion(): {
  regions: MapRegion[];
  average: number;
  chungnamRank: number;
  isLoading: boolean;
} {
  const { data: regions = [], isLoading } = useQuery({
    queryKey: queryKeys.home.region(),
    queryFn: getHomeRegionList,
    select: toMapRegions,
    ...HOME_QUERY,
  });

  return {
    regions,
    average: nationalAverageOf(regions),
    chungnamRank: nationalRankOf(regions, 'chungnam'),
    isLoading,
  };
}
