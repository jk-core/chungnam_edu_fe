import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPowerPlantList } from '@/service/powerPlant';
import { queryKeys } from '@/service/queryKeys';
import { schoolFromPowerPlant } from '@/mocks/schools';
import type { PowerPlantListItem } from '@/service/powerPlant/type';
import type { School } from '@/interface/energy';

/** 배열을 매번 새로 만들면 이것을 의존성으로 쓰는 memo 가 렌더마다 다시 돈다. */
const NONE: School[] = [];
const NONE_ITEMS: PowerPlantListItem[] = [];

function usePowerPlantQuery() {
  return useQuery({
    queryKey: queryKeys.powerPlant.list(),
    queryFn: getPowerPlantList,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 도 전체 발전소 목록 (`/powerPlant/list`).
 *
 * 서버가 필터를 받지 않아 한 번에 받아 두고 화면이 그 위에서 거른다 — 지도 클러스터가 전체
 * 좌표를 쥐고 있어야 묶음 개수가 맞고, 지역·상태를 토글할 때마다 다시 받으면 매번 새로 그려진다.
 *
 * 발전량·이용률은 아직 API 가 없어 `schoolFromPowerPlant` 가 지어 넣는다.
 */
export function usePowerPlantList(): { plants: School[]; isLoading: boolean } {
  const { data, isLoading } = usePowerPlantQuery();

  const plants = useMemo(() => data?.map(schoolFromPowerPlant) ?? NONE, [data]);

  return { plants, isLoading };
}

/**
 * 같은 목록을 계약 그대로 본다 — 등록 폼의 발전소 셀렉트가 쓴다.
 * `usePowerPlantList` 가 지어 넣는 발전량·이용률은 폼이 고를 값과 무관하다.
 */
export function usePowerPlantOptions(): { plants: PowerPlantListItem[]; isLoading: boolean } {
  const { data, isLoading } = usePowerPlantQuery();

  return { plants: data ?? NONE_ITEMS, isLoading };
}

export function usePowerPlantById(id: string | null): School | null {
  const { plants } = usePowerPlantList();

  return useMemo(() => plants.find((plant) => plant.id === id) ?? null, [plants, id]);
}
