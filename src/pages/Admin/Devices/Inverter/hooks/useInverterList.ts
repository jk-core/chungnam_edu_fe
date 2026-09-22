import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { DEFAULT_PAGE_SIZE } from '@/components/common/Pagination';
import { getManageInverterPage } from '@/service/inverter';
import { queryKeys } from '@/service/queryKeys';
import type { ManageInverterPageParams } from '@/service/inverter/type';

/**
 * 인버터 제품 목록 (SFR-017-04).
 * 검색·기종 좁히기·쪽 나눔을 서버가 하므로 조건 한 벌을 이 훅이 쥔다.
 */
export function useInverterList() {
  const [param, setParam] = useState<ManageInverterPageParams>({ page: 0, size: DEFAULT_PAGE_SIZE });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.manage.inverter.page(param),
    queryFn: () => getManageInverterPage(param),
    placeholderData: keepPreviousData,
  });

  return {
    rows: data?.content ?? [],
    totalCount: data?.totalElements ?? 0,
    pageCount: Math.max(1, data?.totalPages ?? 1),
    param,
    setParam,
    isLoading,
  };
}
