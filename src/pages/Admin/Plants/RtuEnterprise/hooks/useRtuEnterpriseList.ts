import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { DEFAULT_PAGE_SIZE } from '@/components/common/Pagination';
import { getManageRtuEnterprisePage } from '@/service/rtuEnterprise';
import { queryKeys } from '@/service/queryKeys';
import type { ManageRtuEnterprisePageParams } from '@/service/rtuEnterprise/type';

/**
 * RTU 업체 목록 (SFR-016-01).
 *
 * 검색과 쪽 나눔을 서버가 한다 — 조건 한 벌을 이 훅이 쥐고, 보드와 표는 그것을 읽어 그린다.
 * 서버 쪽번호는 0 부터, 화면 Pagination 은 1 부터 세므로 그 경계에서만 더하고 뺀다.
 */
export function useRtuEnterpriseList() {
  const [param, setParam] = useState<ManageRtuEnterprisePageParams>({ page: 0, size: DEFAULT_PAGE_SIZE });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.manage.rtuEnterprise.page(param),
    queryFn: () => getManageRtuEnterprisePage(param),
    // 쪽을 넘길 때 표가 비었다 다시 차면 눈이 따라가지 못한다.
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
