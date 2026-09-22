import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { DEFAULT_PAGE_SIZE } from '@/components/common/Pagination';
import { getManageSolaModulePage } from '@/service/module';
import { queryKeys } from '@/service/queryKeys';
import type { ManageSolaModulePageParams } from '@/service/module/type';

/**
 * 모듈 제품 목록 (SFR-017-05).
 * 검색·쪽 나눔을 서버가 하므로 조건 한 벌을 이 훅이 쥔다.
 */
export function useModuleList() {
  const [param, setParam] = useState<ManageSolaModulePageParams>({ page: 0, size: DEFAULT_PAGE_SIZE });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.manage.module.page(param),
    queryFn: () => getManageSolaModulePage(param),
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
