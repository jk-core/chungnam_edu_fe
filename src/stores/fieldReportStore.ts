import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useMemo } from 'react';
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

  /** 관리자가 새로 세운 점검 양식 (SFR-021-14) */
  templateCreated: ReportTemplate[];
  /** 관리자가 고친 점검 양식 — 시드 위에 덮어쓴다 (SFR-021-14) */
  templatePatched: Record<string, ReportTemplate>;
  templateDeleted: string[];
  /** 양식 개정 이력. 새 판을 낼 때마다 앞에 쌓인다 */
  revisions: TemplateRevision[];
  /** revision 이 null 이면 기간만 고친 것이라 이력에 남기지 않는다 (SFR-021-14/19) */
  saveTemplate: (template: ReportTemplate, revision: TemplateRevision | null, isNew: boolean) => void;
  removeTemplate: (id: string) => void;
  nextTemplateId: () => string;
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

      templateCreated: [],
      templatePatched: {},
      templateDeleted: [],
      revisions: [],
      saveTemplate: (template, revision, isNew) =>
        set((state) => ({
          // 새로 세운 양식은 자기 목록에 쌓고, 이미 있던 것은 변경분으로만 덮는다.
          templateCreated: isNew
            ? [template, ...state.templateCreated]
            : state.templateCreated.map((item) => (item.id === template.id ? template : item)),
          templatePatched: isNew || state.templateCreated.some((item) => item.id === template.id)
            ? state.templatePatched
            : { ...state.templatePatched, [template.id]: template },
          revisions: revision ? [revision, ...state.revisions] : state.revisions,
        })),
      removeTemplate: (id) => set((state) => ({ templateDeleted: [...state.templateDeleted, id] })),
      nextTemplateId: () => `TPL-${String(1000 + get().templateCreated.length + 1)}`,
    }),
    {
      name: 'cne-field-reports',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        created: state.created,
        patched: state.patched,
        deleted: state.deleted,
        templateCreated: state.templateCreated,
        templatePatched: state.templatePatched,
        templateDeleted: state.templateDeleted,
        revisions: state.revisions,
      }),
      /*
        1 판의 보고서에는 점검 설비 목록과 발전소 정보가 들어 있고 점검대상이 이름 문자열이었다.
        양식도 `targetKind` 로 갈래를 담았다 — 옛 값을 그대로 읽으면 점검대상 칸이 빈다.
        2 판은 점검자 연락처를 `basics` 안에 담았다 — 그대로 읽으면 연락처 칸이 빈다.
        3 판까지 양식이 대분류를 갖고 문항 id 에 그 순번이 박혀 있었다 — 그대로 읽으면 양식이
        터지고 사진·답의 연결이 조용히 어긋난다.
        판이 다르면 보고서·양식 저장분을 비우고 시드에서 다시 세운다.
      */
      version: 4,
      migrate: (persisted) => ({
        ...(persisted as FieldReportState),
        created: [],
        patched: {},
        templateCreated: [],
        templatePatched: {},
        // 지운 양식 목록만 남기면 시드가 도로 지워져 고를 양식이 0개가 된다.
        templateDeleted: [],
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

/** 시드 + 관리자 등록·수정분이 합쳐진 점검 양식 (SFR-021-14) */
export function mergeTemplates(
  created: ReportTemplate[],
  patched: Record<string, ReportTemplate>,
  deleted: string[],
): ReportTemplate[] {
  return [...created, ...CHECKLIST_TEMPLATES]
    .filter((template) => !deleted.includes(template.id))
    .map((template) => patched[template.id] ?? template);
}

/** 최신 양식 목록. 표와 편집기가 같은 목록을 봐야 해서 한 곳에서 꺼낸다 */
export function useTemplates(): ReportTemplate[] {
  const templateCreated = useFieldReportStore((state) => state.templateCreated);
  const templatePatched = useFieldReportStore((state) => state.templatePatched);
  const templateDeleted = useFieldReportStore((state) => state.templateDeleted);

  return useMemo(
    () => mergeTemplates(templateCreated, templatePatched, templateDeleted),
    [templateCreated, templatePatched, templateDeleted],
  );
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
  const { templateCreated, templatePatched, templateDeleted } = useFieldReportStore.getState();
  const live = mergeTemplates(templateCreated, templatePatched, templateDeleted);

  return live.find((item) => item.id === id) ?? live[0] ?? CHECKLIST_TEMPLATES[0];
}

export default useFieldReportStore;
