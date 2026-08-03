import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { FieldReport } from '@/interface/fieldReport';
import { SEED_FIELD_REPORTS } from '@/mocks/fieldReport';

interface FieldReportState {
  /** 사용자가 새로 쓴 보고서 */
  created: FieldReport[];
  /** 시드 보고서에 얹은 변경분 */
  patched: Record<string, Partial<FieldReport>>;
  deleted: string[];
  save: (report: FieldReport) => void;
  patch: (id: string, change: Partial<FieldReport>) => void;
  remove: (id: string) => void;
  nextId: () => string;
}

const useFieldReportStore = create<FieldReportState>()(
  persist(
    (set, get) => ({
      created: [],
      patched: {},
      deleted: [],
      save: (report) =>
        set((state) => {
          const exists = state.created.some((item) => item.id === report.id);

          if (exists) {
            return { created: state.created.map((item) => (item.id === report.id ? report : item)) };
          }

          // 시드 보고서를 고친 경우는 변경분으로만 쌓는다.
          if (SEED_FIELD_REPORTS.some((item) => item.id === report.id)) {
            return { patched: { ...state.patched, [report.id]: report } };
          }

          return { created: [report, ...state.created] };
        }),
      patch: (id, change) =>
        set((state) => {
          if (state.created.some((item) => item.id === id)) {
            return { created: state.created.map((item) => (item.id === id ? { ...item, ...change } : item)) };
          }

          return { patched: { ...state.patched, [id]: { ...state.patched[id], ...change } } };
        }),
      remove: (id) => set((state) => ({ deleted: [...state.deleted, id] })),
      // 새로 만든 것끼리 번호가 겹치지 않게 뒤에서부터 이어 붙인다.
      nextId: () => `FR-${String(2700 + get().created.length)}`,
    }),
    {
      name: 'cne-field-reports',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ created: state.created, patched: state.patched, deleted: state.deleted }),
    },
  ),
);

/**
 * 시드와 사용자 변경분을 합쳐 돌려준다.
 * 화면은 늘 이 셀렉터만 부르므로, 실제 API 로 갈 때 여기 안쪽만 바꾸면 된다.
 */
export function mergeFieldReports(
  created: FieldReport[],
  patched: Record<string, Partial<FieldReport>>,
  deleted: string[],
): FieldReport[] {
  return [...created, ...SEED_FIELD_REPORTS]
    .filter((report) => !deleted.includes(report.id))
    .map((report) => ({ ...report, ...patched[report.id] }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function listFieldReports(): FieldReport[] {
  const { created, patched, deleted } = useFieldReportStore.getState();

  return mergeFieldReports(created, patched, deleted);
}

export function getFieldReport(id: string): FieldReport | null {
  return listFieldReports().find((report) => report.id === id) ?? null;
}

export default useFieldReportStore;
