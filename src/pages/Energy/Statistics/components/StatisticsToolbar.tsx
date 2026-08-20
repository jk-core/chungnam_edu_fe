import { describeDetail, DETAIL_UNIT } from '@/mocks/generation';
import { MSG } from '@/configs/messages';
import { exportCsv } from '@/utils/export';
import { toast } from '@/stores/toastStore';
import type { CsvColumn } from '@/utils/export';
import { PeriodFilter } from './PeriodFilter';
import type { StatisticsView } from '../hooks/useStatisticsView';

/**
 * 조회 조건 줄과 내려받기 (SFR-007-01/02).
 *
 * 내려받기는 이 줄의 일이다 — 무엇을 내려받을지는 여기서 고른 기간·날짜가 정하므로, 파일을
 * 만드는 셈도 조건 옆에 있어야 한다. 화면 어딘가에 따로 두면 조건을 바꾼 뒤 그 조건으로
 * 내려받는 것인지 확인하러 두 곳을 오가게 된다.
 */
export function StatisticsToolbar({ view }: { view: StatisticsView }) {
  const { label, period, setPeriod, date, setDate, basis, setBasis, stat, detail } = view;

  const download = () => {
    if (stat.series.length === 0) {
      toast.error(MSG.noResult);

      return;
    }

    // 화면은 단위를 줄여 보여 주지만 파일에는 원단위 그대로 담는다.
    const columns: CsvColumn<number>[] = [
      { header: DETAIL_UNIT[period], value: (_, index) => detail[index]?.label ?? '' },
      { header: '발전량(kWh)', value: (value) => Math.round(value) },
      { header: '일사량(kWh/m²)', value: (_, index) => detail[index]?.irradiance ?? '' },
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
