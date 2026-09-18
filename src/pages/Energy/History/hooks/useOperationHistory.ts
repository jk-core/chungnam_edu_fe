import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getInverters } from '@/mocks/equipment';
import { getOperationHistoryPage } from '@/service/operationHistory';
import { queryKeys } from '@/service/queryKeys';
import { serverIdOf } from '@/configs/scope';
import { useCollectionDate } from '@/stores/filterStore';
import { usePlantScope } from '@/hooks/usePlantScope';

/** 한 화면에 펼 계측 줄 수 — 하루치는 수백 건이라 나눠 본다 */
const PAGE_SIZE = 20;

/**
 * 인버터별 수집주기 운전이력 (SFR-009, SFR-010).
 *
 * 조회 대상과 조회일은 화면 밖에서 온다 — 좌측 조회 대상 트리와 전역 날짜 필터다.
 * 그래서 이 훅이 소유하는 것은 쪽 번호 하나뿐이다.
 *
 * 쪽·정렬은 서버가 한다. 정렬 UI 가 없으므로 `sortField` 는 보내지 않고 서버 기본을 따른다.
 */
export function useOperationHistory() {
  const { plant, inverter, label } = usePlantScope();
  const [date] = useCollectionDate();
  /*
    서버 쪽 번호는 0 부터다. 화면의 Pagination 만 1 부터 세므로 그 경계에서 더하고 뺀다.
    쪽은 조회 대상·날짜에 묶어 둔다 — 3쪽을 보던 채로 다른 설비를 열면 빈 쪽이 나온다.
  */
  const [pageState, setPageState] = useState({ key: '', page: 0 });

  const inverters = useMemo(() => getInverters(plant?.id ?? null), [plant?.id]);
  // 인버터까지 좁혔으면 그 인버터, 발전소까지면 첫 인버터를 편다.
  const selected = inverter ?? inverters[0] ?? null;
  const cid = selected ? serverIdOf(selected.id, 'i') : null;
  const targetDate = dayjs(date).format('YYYY-MM-DD');

  const pageKey = `${cid ?? ''}-${targetDate}`;
  const page = pageState.key === pageKey ? pageState.page : 0;
  const setPage = (next: number) => setPageState({ key: pageKey, page: next });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.operationHistory.page(cid, targetDate, page, PAGE_SIZE),
    queryFn: () => getOperationHistoryPage({ cid: cid ?? 0, targetDate, page, size: PAGE_SIZE }),
    enabled: cid !== null,
    // 쪽을 넘길 때 표가 비었다 다시 차면 눈이 따라가지 못한다.
    placeholderData: keepPreviousData,
  });

  return {
    rows: data?.content ?? [],
    totalCount: data?.totalElements ?? 0,
    pageCount: Math.max(1, data?.totalPages ?? 1),
    page,
    setPage,
    isLoading,
    selected,
    inverterCount: inverters.length,
    plantLabel: plant?.name ?? label,
    scopeLabel: label,
    date,
    targetDate,
    cid,
  };
}
