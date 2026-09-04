import { describeDetail, DETAIL_UNIT } from '@/mocks/generation';
import { MSG } from '@/configs/messages';
import { exportCsv } from '@/utils/export';
import { formatPercent } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import type { CsvColumn } from '@/utils/export';
import { BASIS_LABEL } from '../utils/statBasis';
import { PeriodFilter } from './PeriodFilter';
import type { BasisRow } from '../utils/statBasis';
import type { StatisticsView } from '../hooks/useStatisticsView';

/**
 * 조회 조건 줄과 내려받기 (SFR-007-01/02).
 *
 * 내려받기는 이 줄의 일이다 — 무엇을 내려받을지는 여기서 고른 기간·날짜·조회 기준이 정하므로,
 * 파일을 만드는 셈도 조건 옆에 있어야 한다. 화면 어딘가에 따로 두면 조건을 바꾼 뒤 그 조건으로
 * 내려받는 것인지 확인하러 두 곳을 오가게 된다.
 *
 * 그래서 축에 따라 담기는 것도 여기서 가른다 — 집계 축일 때 화면에 서는 것은 집계표뿐인데
 * 버튼이 고른 발전소의 추이를 내려주면 화면에 없는 것을 받게 된다.
 */
export function StatisticsToolbar({ view }: { view: StatisticsView }) {
  const { label, period, setPeriod, date, setDate, basis, setBasis, basisRows, stat, detail } = view;

  const download = () => {
    if (basis !== 'device') {
      if (basisRows.length === 0) {
        toast.error(MSG.noResult);

        return;
      }

      const columns: CsvColumn<BasisRow>[] = [
        { header: BASIS_LABEL[basis], value: (row) => row.name },
        { header: '발전소 수', value: (row) => row.count },
        { header: '설비용량(kW)', value: (row) => Math.round(row.capacityKw * 10) / 10 },
        { header: '발전량(kWh)', value: (row) => Math.round(row.generationKwh) },
        { header: '설비이용률', value: (row) => formatPercent(row.utilization) },
      ];
      const filename = `발전집계_${BASIS_LABEL[basis]}별_${describeDetail(period, date)}`;

      exportCsv(filename, columns, basisRows);
      toast.success(MSG.downloadStart(filename));

      return;
    }

    if (stat.series.length === 0) {
      toast.error(MSG.noResult);

      return;
    }

    // 화면은 단위를 줄여 보여 주지만 파일에는 원단위 그대로 담는다.
    const columns: CsvColumn<number>[] = [
      { header: DETAIL_UNIT[period], value: (_, index) => detail[index]?.label ?? '' },
      { header: '발전량(kWh)', value: (value) => Math.round(value) },
      { header: '일사강도(W/m²)', value: (_, index) => detail[index]?.irradiance ?? '' },
    ];
    const filename = `발전현황_${label}_${describeDetail(period, date)}`;

    exportCsv(filename, columns, stat.series);
    toast.success(MSG.downloadStart(filename));
  };

  return (
    <PeriodFilter
      period={period}
      onPeriodChange={setPeriod}
      date={date}
      onDateChange={setDate}
      basis={basis}
      onBasisChange={setBasis}
      onDownload={download}
    />
  );
}
