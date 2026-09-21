import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { DEFAULT_PAGE_SIZE } from '@/components/common/Pagination';
import { getManageIrradPage } from '@/service/irrad';
import { queryKeys } from '@/service/queryKeys';
import type { ManageIrradPageParams } from '@/service/irrad/type';

/**
 * 일사량계 목록 (SFR-016-01/05).
 * 검색·쪽 나눔을 서버가 하므로 조건 한 벌을 이 훅이 쥔다.
 */
export function usePyranometerList() {
  const [param, setParam] = useState<ManageIrradPageParams>({ page: 0, size: DEFAULT_PAGE_SIZE });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.manage.irrad.page(param),
    queryFn: () => getManageIrradPage(param),
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
