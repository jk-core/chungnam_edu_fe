import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { TODAY } from '@/mocks/today';
import { fromIso, toIso } from '@/utils/date';
import type { DateRangeValue } from '@/components/common/DateRangePicker';

interface FilterState {
  /** 발전통계 기준일 (YYYY-MM-DD) */
  statisticsDate: string;
  /** 수집데이터 조회일 (YYYY-MM-DD) */
  collectionDate: string;
  /** 진단 조회 기간 (YYYY-MM-DD) */
  diagnosisRange: { start: string; end: string };
  /** 알림이력 조회 기간 (YYYY-MM-DD) */
  alertRange: { start: string; end: string };
  setStatisticsDate: (value: Date) => void;
  setCollectionDate: (value: Date) => void;
  setDiagnosisRange: (value: DateRangeValue) => void;
  setAlertRange: (value: DateRangeValue) => void;
}

// 목업 기준일을 그대로 쓴다. 실시간 오늘을 쓰면 시드 데이터와 날짜가 어긋난다.
const today = TODAY;

const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      statisticsDate: today.format('YYYY-MM-DD'),
      collectionDate: today.format('YYYY-MM-DD'),
      diagnosisRange: {
        start: today.subtract(29, 'day').format('YYYY-MM-DD'),
        end: today.format('YYYY-MM-DD'),
      },
      alertRange: {
        start: today.subtract(59, 'day').format('YYYY-MM-DD'),
        end: today.format('YYYY-MM-DD'),
      },
      setStatisticsDate: (value) => set({ statisticsDate: toIso(value) }),
      setCollectionDate: (value) => set({ collectionDate: toIso(value) }),
      setDiagnosisRange: (value) => set({ diagnosisRange: { start: toIso(value.start), end: toIso(value.end) } }),
      setAlertRange: (value) => set({ alertRange: { start: toIso(value.start), end: toIso(value.end) } }),
    }),
    {
      name: 'cne-filters',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** 발전통계 기준일 */
export function useStatisticsDate(): [Date, (value: Date) => void] {
  const iso = useFilterStore((state) => state.statisticsDate);
  const setDate = useFilterStore((state) => state.setStatisticsDate);

  return [fromIso(iso), setDate];
}

/** 수집데이터 조회일 */
export function useCollectionDate(): [Date, (value: Date) => void] {
  const iso = useFilterStore((state) => state.collectionDate);
  const setDate = useFilterStore((state) => state.setCollectionDate);

  return [fromIso(iso), setDate];
}

/** 진단 조회 기간 */
export function useDiagnosisRange(): [DateRangeValue, (value: DateRangeValue) => void] {
  const range = useFilterStore((state) => state.diagnosisRange);
  const setRange = useFilterStore((state) => state.setDiagnosisRange);

  return [{ start: fromIso(range.start), end: fromIso(range.end) }, setRange];
}

/** 알림이력 조회 기간 */
export function useAlertRange(): [DateRangeValue, (value: DateRangeValue) => void] {
  const range = useFilterStore((state) => state.alertRange);
  const setRange = useFilterStore((state) => state.setAlertRange);

  return [{ start: fromIso(range.start), end: fromIso(range.end) }, setRange];
}

export default useFilterStore;
