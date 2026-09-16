import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPowerPlantList } from '@/service/powerPlant';
import { queryKeys } from '@/service/queryKeys';
import { schoolFromPowerPlant } from '@/mocks/schools';
import type { School } from '@/interface/energy';

/** 배열을 매번 새로 만들면 이것을 의존성으로 쓰는 memo 가 렌더마다 다시 돈다. */
const NONE: School[] = [];

/**
 * 도 전체 발전소 목록 (`/powerPlant/list`).
 *
 * 서버가 필터를 받지 않아 한 번에 받아 두고 화면이 그 위에서 거른다 — 지도 클러스터가 전체
 * 좌표를 쥐고 있어야 묶음 개수가 맞고, 지역·상태를 토글할 때마다 다시 받으면 매번 새로 그려진다.
 *
 * 발전량·이용률은 아직 API 가 없어 `schoolFromPowerPlant` 가 지어 넣는다.
 */
export function usePowerPlantList(): { plants: School[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.powerPlant.list(),
    queryFn: getPowerPlantList,
    staleTime: 5 * 60 * 1000,
  });

  const plants = useMemo(() => data?.map(schoolFromPowerPlant) ?? NONE, [data]);

  return { plants, isLoading };
}

export function usePowerPlantById(id: string | null): School | null {
  const { plants } = usePowerPlantList();

  return useMemo(() => plants.find((plant) => plant.id === id) ?? null, [plants, id]);
}
