import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { FieldReport, ReportTemplate, TemplateRevision } from '@/interface/fieldReport';
import { CHECKLIST_TEMPLATES, SEED_FIELD_REPORTS, SEED_TEMPLATE_REVISIONS } from '@/mocks/fieldReport';

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

  /** 관리자가 고친 점검 양식 — 시드 위에 덮어쓴다 (SFR-021-14) */
  templatePatched: Record<string, ReportTemplate>;
  /** 양식 개정 이력. 새 판을 낼 때마다 앞에 쌓인다 */
  revisions: TemplateRevision[];
  saveTemplate: (template: ReportTemplate, revision: TemplateRevision) => void;
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

      templatePatched: {},
      revisions: [],
      saveTemplate: (template, revision) =>
        set((state) => ({
          templatePatched: { ...state.templatePatched, [template.id]: template },
          revisions: [revision, ...state.revisions],
        })),
    }),
    {
      name: 'cne-field-reports',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        created: state.created,
        patched: state.patched,
        deleted: state.deleted,
        templatePatched: state.templatePatched,
        revisions: state.revisions,
      }),
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

/** 시드 + 관리자 수정분이 합쳐진 점검 양식 (SFR-021-14) */
export function mergeTemplates(patched: Record<string, ReportTemplate>): ReportTemplate[] {
  return CHECKLIST_TEMPLATES.map((template) => patched[template.id] ?? template);
}

/** 시드 + 사용자 저장분이 합쳐진 양식 개정 이력 */
export function mergeRevisions(revisions: TemplateRevision[]): TemplateRevision[] {
  return [...revisions, ...SEED_TEMPLATE_REVISIONS];
}

/**
 * 화면 어디서나 최신 양식을 집는다.
 * 보고서를 새로 쓸 때만 쓴다 — 이미 쓰인 보고서는 자기 문항을 통째로 들고 있다.
 */
export function getLiveTemplate(id: string): ReportTemplate {
  const { templatePatched } = useFieldReportStore.getState();

  return mergeTemplates(templatePatched).find((item) => item.id === id) ?? CHECKLIST_TEMPLATES[0];
}

export default useFieldReportStore;
