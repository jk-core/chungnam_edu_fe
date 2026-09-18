import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAreaDropdownList } from '@/service/area';
import { queryKeys } from '@/service/queryKeys';

export interface AreaOption {
  value: string;
  label: string;
}

/** 배열을 매번 새로 만들면 이것을 의존성으로 쓰는 memo 가 렌더마다 다시 돈다. */
const NONE: AreaOption[] = [];

/**
 * 지역 선택 항목 (`/area/list/dropdown`).
 *
 * **응답의 `id` 는 숫자인데 발전소의 `regionCode` 는 문자열이다.** 여기서 문자열로 맞춰 둔다 —
 * 그대로 두면 `44131 !== '44131'` 이라 필터가 한 건도 걸리지 않는다. BE 가 `~Code` 를 문자열로
 * 통일해 주면 이 변환이 사라진다.
 *
 * 행정구역은 바뀌지 않아 오래 들고 있는다. 이름으로 좁히는 `name` 은 쓰지 않는다 — 항목이
 * 스물 안팎이라 받아 둔 목록에서 고르는 편이 빠르다.
 */
export function useAreaOptions(): AreaOption[] {
  const { data } = useQuery({
    queryKey: queryKeys.area.dropdown(),
    queryFn: () => getAreaDropdownList(),
    staleTime: 60 * 60 * 1000,
  });

  return useMemo(() => data?.map((area) => ({ value: String(area.id), label: area.name })) ?? NONE, [data]);
}
