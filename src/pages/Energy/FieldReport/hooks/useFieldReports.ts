import { useMemo } from 'react';
import { findDueTemplates, findRepeatIssues } from '@/mocks/fieldReport';
import { useAuthUser } from '@/stores/authStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import useFieldReportStore, { mergeFieldReports, useTemplates } from '@/stores/fieldReportStore';
import { getFieldPermission } from '../utils/fieldPermission';

/**
 * 이 화면이 다루는 보고서 한 벌 (SFR-021).
 *
 * 목록·상세·작성이 같은 목록과 같은 양식을 봐야 하므로 조회는 여기 한곳에 모은다.
 * 권한은 계정에서만 갈리므로 함께 내보낸다.
 */
export function useFieldReports() {
  const { plant, label } = usePlantScope();
  const user = useAuthUser();

  const created = useFieldReportStore((state) => state.created);
  const patched = useFieldReportStore((state) => state.patched);
  const deleted = useFieldReportStore((state) => state.deleted);
  const templates = useTemplates();

  const permission = getFieldPermission(user);

  const reports = useMemo(() => {
    const all = mergeFieldReports(created, patched, deleted).filter(permission.canRead);

    return plant ? all.filter((item) => item.schoolId === plant.id) : all;
    // permission 은 user 에서 파생된다 — 의존성은 user 하나로 충분하다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plant, created, patched, deleted, user]);

  return {
    plant,
    label,
    permission,
    templates,
    reports,
    templateOf: (id: string) => templates.find((item) => item.id === id) ?? templates[0],
    repeats: findRepeatIssues(reports),
    /** 마감이 다가오는데 아직 안 낸 점검 (SFR-021-19) */
    dueTemplates: plant ? findDueTemplates(templates, reports) : [],
  };
}
