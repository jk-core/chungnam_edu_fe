import dayjs from 'dayjs';
import { getMonthlyReport } from '@/mocks/reports';
import { usePlantScope } from '@/hooks/usePlantScope';
import { useStatisticsDate } from '@/stores/filterStore';
import useFieldReportStore, { mergeFieldReports } from '@/stores/fieldReportStore';

/**
 * 이 달, 이 발전소의 월간보고서 재료 (SFR-019, SFR-020).
 *
 * 보고 월은 발전통계와 같은 전역 값을 쓴다 — 통계에서 보던 달을 그대로 이어 보게 된다.
 */
export function useMonthlyReport() {
  const { plant } = usePlantScope();
  const [date] = useStatisticsDate();

  const fieldCreated = useFieldReportStore((state) => state.created);
  const fieldPatched = useFieldReportStore((state) => state.patched);
  const fieldDeleted = useFieldReportStore((state) => state.deleted);

  const cursor = dayjs(date);
  // `getMonthlyReport` 는 결과를 캐시하므로 매 렌더 불러도 다시 셈하지 않는다.
  const report = plant ? getMonthlyReport(plant.id, cursor.year(), cursor.month()) : null;

  /*
    이 달, 이 발전소에서 올라온 현장보고서 (SFR-019-07).
    작성중인 것은 뺀다 — 아직 제출도 안 한 내용이 월간보고서에 실리면 안 된다.
  */
  const monthKey = cursor.format('YYYY-MM');
  const fieldReports = plant
    ? mergeFieldReports(fieldCreated, fieldPatched, fieldDeleted)
      .filter((item) => item.schoolId === plant.id && item.state !== 'draft' && item.date.startsWith(monthKey))
      .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  return {
    plant,
    report,
    fieldReports,
    filename: plant ? `월간보고서_${plant.name}_${cursor.format('YYYYMM')}` : '',
  };
}
