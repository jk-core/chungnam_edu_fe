import { describeDetail, DETAIL_UNIT } from '@/mocks/generation';
import { MSG } from '@/configs/messages';
import { exportCsv } from '@/utils/export';
import { toast } from '@/stores/toastStore';
import type { CsvColumn } from '@/utils/export';
import { BasisTable } from './components/BasisTable';
import { ChildCompareChart } from './components/ChildCompareChart';
import { DetailTrend } from './components/DetailTrend';
import { InverterDepth } from './Inverter';
import { PeriodFilter } from './components/PeriodFilter';
import { PowerPlantDepth } from './PowerPlant';
import { ScopePath } from './components/ScopePath';
import { StatSummary } from './components/StatSummary';
import { useStatisticsView } from './hooks/useStatisticsView';
import styles from './Statistics.module.scss';

/**
 * 발전통계 (SFR-007, SFR-008).
 *
 * 뎁스를 여러 단 파고드는 화면이라, 뎁스마다 다른 부분만 하위 폴더로 떼어 두고 여기서 결합한다.
 * 위아래로 붙는 뼈대 — 기간 고르기, 집계표, 계층 경로, 요약, 추이 — 는 어느 뎁스에서나 같으므로
 * 공통 조각으로 두고, 갈라지는 것은 「하위 설비」 한 칸뿐이다.
 */
function StatisticsPage() {
  const view = useStatisticsView();
  const { node, label, period, setPeriod, date, setDate, basis, setBasis, path, childKind, stat, detail } = view;

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

  // 인버터가 조회 단위의 끝이다. 그 아래는 보여만 주므로 뎁스 화면 자체가 다르다.
  const Depth = node.kind === 'inverter' ? InverterDepth : PowerPlantDepth;

  return (
    <div className={styles.tab}>
      {/*
        발전 달력은 따로 놓지 않고 날짜 선택 달력 안에 얹는다 (SFR-007-01/02).
        날짜를 고르는 자리와 그 날 실적을 보는 자리가 같아야 두 번 찾지 않는다.
      */}
      <PeriodFilter
        period={period}
        onPeriodChange={setPeriod}
        date={date}
        onDateChange={setDate}
        basis={basis}
        onBasisChange={setBasis}
        onDownload={download}
      />

      <BasisTable view={view} />

      <ScopePath path={path} currentId={node.id} />

      <StatSummary view={view} />

      {childKind ? <Depth view={view} childKind={childKind} /> : null}
      {childKind ? <ChildCompareChart view={view} childKind={childKind} /> : null}

      <DetailTrend view={view} />
    </div>
  );
}

export default StatisticsPage;
