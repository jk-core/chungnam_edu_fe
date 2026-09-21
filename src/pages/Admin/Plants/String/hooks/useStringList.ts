import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { DEFAULT_PAGE_SIZE } from '@/components/common/Pagination';
import { getManageStringPage } from '@/service/string';
import { queryKeys } from '@/service/queryKeys';
import type { ManageStringPageParams } from '@/service/string/type';

/**
 * 스트링 목록 (SFR-016-01, SFR-017-06).
 * 한 줄이 스트링 인버터 한 대다 — 스트링이 0조인 설비도 함께 서서, 새로 심는 자리도 여기서 연다.
 */
export function useStringList() {
  const [param, setParam] = useState<ManageStringPageParams>({ page: 0, size: DEFAULT_PAGE_SIZE });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.manage.string.page(param),
    queryFn: () => getManageStringPage(param),
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
