import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EChart } from '@/components/common/EChart';
import {
  CUMULATIVE,
  describeDetail,
  DETAIL_TITLE,
  DETAIL_UNIT,
  getDetailTrend,
  PERIOD_META,
  pickEnergyUnit,
} from '@/mocks/generation';
import { childKindOf, getNodePath, KIND_LABEL } from '@/mocks/tree';
import { DownloadIcon } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Table } from '@/components/common/Table';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, seriesPalette, topLegend } from '@/utils/chart';
import { MSG } from '@/configs/messages';
import { exportCsv } from '@/utils/export';
import { formatCapacity, formatCarbon, formatNumber, formatPercent } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { formatShort } from '@/utils/date';
import { getChildStats, getNodeStat } from '@/mocks/nodeStats';
import { useChartPalette } from '@/hooks/useChartPalette';
import { usePlantScope } from '@/hooks/usePlantScope';
import { useStatisticsScopeRoute } from '@/hooks/useStatisticsScopeRoute';
import { useSelectNode } from '@/stores/plantStore';
import { useStatisticsDate } from '@/stores/filterStore';
import type { Column } from '@/components/common/Table';
import type { PeriodKey } from '@/mocks/generation';
import type { CsvColumn } from '@/utils/export';
import styles from '../Statistics.module.scss';
import { aggregateByBasis, BASIS_LABEL } from './statBasis';
import { ChildGrid } from './ChildGrid';
import { InverterTimeTable } from './InverterTimeTable';
import { PeriodFilter } from './PeriodFilter';
import type { EChartsOption } from 'echarts';
import type { BasisRow, StatBasis } from './statBasis';

type DetailView = 'chart' | 'table';

const DETAIL_VIEW_OPTIONS: { value: DetailView; label: string }[] = [
  { value: 'chart', label: '차트' },
  { value: 'table', label: '표' },
];

/** 색이 여덟 개를 넘어 돌 때 선 모양으로 한 번 더 가른다 (COR-003-03) */
const DASH = ['solid', 'dashed', 'dotted'] as const;

/** 비교 대상이 되는 하나 전 기간 (SFR-007-03) */
const PREVIOUS_UNIT: Record<PeriodKey, 'day' | 'month' | 'year'> = {
  day: 'day',
  month: 'month',
  year: 'year',
};

const PREVIOUS_LABEL: Record<PeriodKey, string> = {
  day: '전일 발전량',
  month: '전월 발전량',
  year: '전년 발전량',
};

const COMPARE_LABEL: Record<PeriodKey, string> = {
  day: '전일',
  month: '전월',
  year: '전년',
};

export function OverviewTab() {
  // 조회 뎁스는 주소가 쥔다 — 발전소 한 단, 인버터 한 단 (SFR-007).
  useStatisticsScopeRoute();

  const [period, setPeriod] = useState<PeriodKey>('day');
  // 무엇을 기준으로 묶어 볼지 (SFR-008-04)
  const [basis, setBasis] = useState<StatBasis>('device');
  const [detailView, setDetailView] = useState<DetailView>('chart');
  const [date, setDate] = useStatisticsDate();
  const { node, label, factor } = usePlantScope();
  const selectNode = useSelectNode();
  const palette = useChartPalette();
  const childColors = seriesPalette(palette);
  const meta = PERIOD_META[period];

  const stat = useMemo(() => getNodeStat(node, period, date), [node, period, date]);
  const childStats = useMemo(() => getChildStats(node, period, date), [node, period, date]);
  // 지역별·교육청별은 조회 대상 트리와 상관없이 도 전체를 묶어 센다.
  const basisRows = useMemo(() => aggregateByBasis(basis, period, date), [basis, period, date]);

  // 하나 전 같은 기간 — 전일·전월·전년 비교에 쓴다 (SFR-007-03).
  const previousDate = useMemo(
    () => dayjs(date).subtract(1, PREVIOUS_UNIT[period]).toDate(),
    [date, period],
  );
  const previous = useMemo(
    () => getNodeStat(node, period, previousDate),
    [node, period, previousDate],
  );
  const compareRatio = previous.generationKwh > 0
    ? (stat.generationKwh - previous.generationKwh) / previous.generationKwh
    : 0;
  // 발전효율 = 같은 일사량에서 기대되는 발전량 대비 실측 (SFR-007-04)
  const efficiency = stat.expectedKwh > 0 ? stat.generationKwh / stat.expectedKwh : 0;

  const detail = getDetailTrend(period, date);

  // 도 전체는 조회 대상이 아니다 — 계층 경로도 발전소에서 시작한다.
  const path = getNodePath(node.id).filter((item) => item.kind !== 'root');
  const childKind = childKindOf(node);
  // 인버터가 조회 단위의 끝이다. 그 아래 스트링·접속반은 보여만 주고 눌러 내려가지 않는다.
  const canDrill = node.kind !== 'inverter';

  const totalUnit = pickEnergyUnit(stat.generationKwh);

  /*
   * 환경 기여도는 누적 발전량에서 나온다.
   * 계수는 환경부 고시 기준 — CO₂ 0.4594kg/kWh, 30년생 소나무 6.6kgCO₂/년, 4인 가구 350kWh/월.
   */
  const eco = {
    co2SavedKg: CUMULATIVE.co2SavedKg * factor,
    pineTrees: Math.round(CUMULATIVE.pineTrees * factor),
    households: Math.round(CUMULATIVE.households * factor),
  };
  const carbon = formatCarbon(eco.co2SavedKg);
  const capacity = formatCapacity(node.capacityKw);
  const bestIndex = stat.series.reduce((best, value, index) => (value > stat.series[best] ? index : best), 0);
  // 조회 단위(시간·일·월)에 맞춘 상세 추이 — 차트와 표가 같은 값을 본다.
  const detailPeakIndex = stat.series.reduce((best, value, index) => (value > stat.series[best] ? index : best), 0);
  const detailTotal = stat.series.reduce((sum, value) => sum + value, 0);
  const detailUnit = pickEnergyUnit(Math.max(...stat.series, 1));
  // 발전량이 왜 많고 적었는지는 그날 들어온 햇빛의 양이 답한다.
  const totalIrradiance = detail.reduce((sum, point) => sum + point.irradiance, 0);

  const basisColumns: Column<BasisRow>[] = [
    { key: 'name', header: BASIS_LABEL[basis], render: (row) => <strong>{row.name}</strong> },
    { key: 'count', header: '발전소', width: '90px', align: 'right', render: (row) => `${formatNumber(row.count)}개소` },
    {
      key: 'capacity',
      header: '설비용량',
      width: '120px',
      align: 'right',
      render: (row) => `${formatNumber(row.capacityKw, 1)} kW`,
    },
    {
      key: 'generation',
      header: '발전량',
      width: '140px',
      align: 'right',
      render: (row) => {
        const unit = pickEnergyUnit(row.generationKwh);

        return `${formatNumber(row.generationKwh / unit.divider, 1)} ${unit.unit}`;
      },
    },
    {
      key: 'utilization',
      header: '설비이용률',
      width: '110px',
      align: 'right',
      render: (row) => formatPercent(row.utilization),
    },
  ];

  const downloadBasis = () => {
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
  };

  const download = () => {
    if (stat.series.length === 0) {
      toast.error(MSG.noResult);

      return;
    }

    // 화면은 단위를 줄여 보여 주지만 파일에는 원단위 그대로 담는다.
    const csvColumns: CsvColumn<number>[] = [
      { header: DETAIL_UNIT[period], value: (_, index) => detail[index]?.label ?? '' },
      { header: '발전량(kWh)', value: (value) => Math.round(value) },
      { header: '일사량(kWh/m²)', value: (_, index) => detail[index]?.irradiance ?? '' },
    ];
    const filename = `발전현황_${label}_${describeDetail(period, date)}`;

    exportCsv(filename, csvColumns, stat.series);
    toast.success(MSG.downloadStart(filename));
  };

  /**
   * 발전량 막대 + 일사량 선을 겹친 차트. 시간대별과 시점별이 같은 모양을 공유한다.
   * `comparison` 을 주면 하나 전 같은 기간을 점선 막대로 겹쳐 견줄 수 있게 한다 (SFR-007-03).
   */
  const comboOption = (
    labels: string[],
    values: number[],
    irradiance: number[],
    divider: number,
    unit: string,
    irradianceUnit: string,
    comparison?: { name: string; values: number[] },
  ): EChartsOption => ({
    grid: { top: LEGEND_GRID_TOP, right: 52, bottom: 30, left: 58 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
    },
    legend: topLegend(palette, comparison ? ['발전량', comparison.name, '일사량'] : ['발전량', '일사량']),
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
    },
    yAxis: [
      {
        type: 'value',
        name: unit,
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11, padding: [0, 0, 0, -30] },
        splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
        axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
      },
      {
        type: 'value',
        name: irradianceUnit,
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11 },
        splitLine: { show: false },
        axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
      },
    ],
    series: [
      {
        name: '발전량',
        type: 'bar',
        barMaxWidth: 22,
        itemStyle: { color: palette.generation, borderRadius: [4, 4, 0, 0] },
        data: values.map((value) => Number((value / divider).toFixed(2))),
        animationDuration: 700,
        animationDelay: (index: number) => index * 24,
      },
      // 하나 전 기간은 테두리만 있는 막대로 겹쳐, 같은 눈금 위에서 높낮이만 견주게 한다.
      ...(comparison
        ? [{
          name: comparison.name,
          type: 'bar' as const,
          barMaxWidth: 22,
          barGap: '-100%' as const,
          z: 1,
          itemStyle: {
            color: 'transparent',
            borderColor: palette.axis,
            borderWidth: 1,
            borderType: 'dashed' as const,
            borderRadius: [4, 4, 0, 0] as [number, number, number, number],
          },
          data: comparison.values.map((value) => Number((value / divider).toFixed(2))),
          animationDuration: 700,
        }]
        : []),
      {
        name: '일사량',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: palette.irradiance, width: 2 },
        itemStyle: { color: palette.irradiance },
        data: irradiance,
        animationDuration: 800,
        animationDelay: 260,
      },
    ],
  });

  /*
    하위 설비별 발전시간을 한 판에 겹친 차트 (SFR-008-05/06/07).

    발전량을 그대로 겹치면 용량 큰 설비가 판을 덮어 버린다. 설비용량으로 나눈 발전시간이라야
    크기가 다른 설비를 같은 눈금 위에서 견줄 수 있다. 설비마다 다른 색을 주고 한 시점의
    모든 설비 값을 툴팁 하나에 모아, 어느 설비가 언제 처졌는지 좌우로 훑어볼 수 있게 한다.
  */
  const childHourOption: EChartsOption = {
    grid: { top: LEGEND_GRID_TOP, right: 24, bottom: 30, left: 52 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
      valueFormatter: (value) => `${formatNumber(Number(value), 2)} h`,
    },
    legend: topLegend(palette, childStats.map((child) => child.node.name)),
    xAxis: {
      type: 'category',
      data: detail.map((point) => point.label),
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
    },
    yAxis: {
      type: 'value',
      name: 'h',
      nameGap: AXIS_NAME_GAP,
      nameTextStyle: { color: palette.axis, fontSize: 11, padding: [0, 0, 0, -24] },
      splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
      axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
    },
    series: childStats.map((child, index) => ({
      name: child.node.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      // 색만으로 구분되지 않게 선 모양도 함께 바꾼다 (COR-003-03)
      lineStyle: { color: childColors[index % childColors.length], width: 2, type: DASH[index % DASH.length] },
      itemStyle: { color: childColors[index % childColors.length] },
      data: child.series.map((value) => (child.node.capacityKw > 0 ? Number((value / child.node.capacityKw).toFixed(2)) : 0)),
    })),
  };

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

      {/*
        지역별·교육청별 집계 (SFR-008-04).
        설비별은 아래 계층을 파고들지만, 이 둘은 도 전체를 한 표로 묶어 어디가 앞서고 뒤지는지 본다.
      */}
      {basisRows.length > 0 ? (
        <Reveal>
          <Card
            eyebrow="Basis"
            title={`${BASIS_LABEL[basis]}별 발전 집계`}
            description={`${meta.label} 기준 · ${basisRows.length}개 ${BASIS_LABEL[basis]}를 발전량 순으로 늘어놓았습니다. 설비이용률은 용량 대비 실제 발전량입니다.`}
            action={(
              <Button variant="secondary" size="sm" iconLeft={<DownloadIcon />} onClick={downloadBasis}>
                집계 내려받기
              </Button>
            )}
          >
            <Table
              caption={`${BASIS_LABEL[basis]}별 발전 집계`}
              columns={basisColumns}
              rows={basisRows}
              getRowKey={(row) => row.key}
            />
          </Card>
        </Reveal>
      ) : null}

      {/* 지금 어느 계층을 보고 있는지, 위로 어떻게 올라가는지 */}
      <nav className={styles.scopePath} aria-label="조회 계층">
        {path.map((item, index) => (
          <span key={item.id} className={styles.scopePath__item}>
            {index > 0 ? <span className={styles.scopePath__sep}>›</span> : null}
            {item.id === node.id ? (
              <span className={styles.scopePath__current}>
                {item.name}
                <span className={styles.scopePath__kind}>{KIND_LABEL[item.kind]}</span>
              </span>
            ) : (
              <button type="button" className={styles.scopePath__link} onClick={() => selectNode(item.id)}>
                {item.name}
              </button>
            )}
          </span>
        ))}
      </nav>

      <Reveal>
        <Card
          eyebrow="Summary"
          title="발전정보 요약"
          description={`${label} · ${describeDetail(period, date)} 기준입니다.`}
        >
          <dl className={styles.infoGrid}>
            <div>
              <dt>설비용량</dt>
              <dd>
                {capacity.value}
                <span className={styles.infoGrid__unit}>{capacity.unit}</span>
              </dd>
            </div>
            <div>
              <dt>{meta.label} 발전량</dt>
              <dd className={styles.infoGrid__accent}>
                {formatNumber(stat.generationKwh / totalUnit.divider, 2)}
                <span className={styles.infoGrid__unit}>{totalUnit.unit}</span>
              </dd>
            </div>
            {/* 같은 기간 하나 전과의 비교 (SFR-007-03) */}
            <div>
              <dt>{PREVIOUS_LABEL[period]}</dt>
              <dd>
                {formatNumber(previous.generationKwh / totalUnit.divider, 2)}
                <span className={styles.infoGrid__unit}>{totalUnit.unit}</span>
                <span className={compareRatio >= 0 ? styles.deltaUp : styles.deltaDown}>
                  {compareRatio >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(compareRatio), 1)}
                </span>
              </dd>
            </div>
            {/* 발전효율 = 실측 ÷ 같은 일사량에서 기대되는 발전량 (SFR-007-04) */}
            <div>
              <dt>발전효율</dt>
              <dd>
                {formatPercent(efficiency, 1)}
                <span className={styles.infoGrid__unit}>실측/기대</span>
              </dd>
            </div>
            <div>
              <dt>일사량</dt>
              <dd>
                {formatNumber(totalIrradiance, 2)}
                <span className={styles.infoGrid__unit}>kWh/m²</span>
              </dd>
            </div>
            <div>
              <dt>등가 발전시간</dt>
              <dd>
                {formatNumber(stat.hours, 1)}
                <span className={styles.infoGrid__unit}>h</span>
              </dd>
            </div>
            <div>
              <dt>조회 계층</dt>
              <dd>{KIND_LABEL[node.kind]}</dd>
            </div>
            <div>
              <dt>최고 발전 {DETAIL_UNIT[period]}</dt>
              <dd>
                {detail[bestIndex]?.label ?? '—'}
                <span className={styles.infoGrid__unit}>
                  {formatNumber(stat.series[bestIndex] / totalUnit.divider, 2)}
                  {totalUnit.unit}
                </span>
              </dd>
            </div>
            <div>
              <dt>하위 설비</dt>
              <dd>
                {childKind ? formatNumber(node.childIds.length) : '—'}
                <span className={styles.infoGrid__unit}>
                  {childKind ? `${KIND_LABEL[childKind]}` : '최말단'}
                </span>
              </dd>
            </div>
          </dl>

          {/*
            환경 기여도는 별도 페이지였으나, 발전량과 떨어져 있으면 무엇을 얼마나 아꼈는지
            머릿속에서 이어 붙여야 했다. 같은 카드 안에서 바로 잇는다 (회의 결정).
          */}
          <dl className={styles.ecoGrid}>
            <div>
              <dt>CO₂ 절감량</dt>
              <dd>
                {carbon.value}
                <span className={styles.infoGrid__unit}>{carbon.unit}</span>
              </dd>
            </div>
            <div>
              <dt>소나무 환산</dt>
              <dd>
                {formatNumber(eco.pineTrees)}
                <span className={styles.infoGrid__unit}>그루·년</span>
              </dd>
            </div>
            <div>
              <dt>가구 사용량 환산</dt>
              <dd>
                {formatNumber(eco.households)}
                <span className={styles.infoGrid__unit}>가구·년</span>
              </dd>
            </div>
          </dl>
        </Card>
      </Reveal>

      {childKind ? (
        <Reveal delay={0.06}>
          <Card
            eyebrow="Children"
            title={`${KIND_LABEL[childKind]}별 발전`}
            description={
              !canDrill
                ? `${node.name} 아래 ${KIND_LABEL[childKind]} ${childStats.length}개입니다. 발전통계는 인버터까지가 조회 단위라 여기서 더 내려가지는 않습니다 — ${KIND_LABEL[childKind]} 단위 판정은 AI진단에서 봅니다.`
                : node.kind === 'root'
                  ? `이상이 있는 발전소를 앞세워 ${childStats.length}개소를 보여 줍니다. 카드를 누르면 그 발전소로 내려갑니다.`
                  : `${node.name} 아래 ${KIND_LABEL[childKind]} ${childStats.length}개입니다. 카드를 누르면 그 설비로 내려갑니다.`
            }
          >
            <ChildGrid
              stats={childStats}
              selectedId={node.id}
              dateLabel={formatShort(date)}
              emptyLabel={`${label} 아래에는 더 내려갈 설비가 없습니다.`}
              interactive={canDrill}
            />
          </Card>
        </Reveal>
      ) : null}

      {childKind ? (
        <Reveal delay={0.08}>
          <Card
            eyebrow="Compare"
            title={`${DETAIL_UNIT[period]}별 ${KIND_LABEL[childKind]} 발전시간`}
            description={`${KIND_LABEL[childKind]}마다 다른 색과 선 모양으로 구분했습니다. 선 위에 마우스를 올리면 그 ${DETAIL_UNIT[period]}의 값이 한꺼번에 나옵니다.`}
          >
            <EChart
              option={childHourOption}
              height={320}
              summary={`${label} 아래 ${KIND_LABEL[childKind]} ${childStats.length}개의 ${DETAIL_UNIT[period]}별 발전시간 비교.`}
            />
          </Card>
        </Reveal>
      ) : null}

      <Reveal delay={0.1}>
        <Card
          eyebrow="Detail"
          title={`${DETAIL_TITLE[period]} 발전량`}
          description={`${describeDetail(period, date)} · 최고는 ${detail[detailPeakIndex]?.label ?? '—'}, 합계 ${formatNumber(detailTotal / detailUnit.divider, 2)}${detailUnit.unit}입니다. 점선 막대는 ${COMPARE_LABEL[period]}이라 같은 눈금에서 견줄 수 있습니다. 표로 바꾸면 같은 값을 숫자로 봅니다.`}
          action={
            <SegmentedControl
              label="보기 방식"
              size="sm"
              options={DETAIL_VIEW_OPTIONS}
              value={detailView}
              onChange={setDetailView}
            />
          }
          padding={detailView === 'table' ? 'none' : 'md'}
        >
          {detailView === 'chart' ? (
            <EChart
              option={comboOption(
                detail.map((point) => point.label),
                stat.series,
                detail.map((point) => point.irradiance),
                detailUnit.divider,
                detailUnit.unit,
                'kWh/m²',
                { name: COMPARE_LABEL[period], values: previous.series },
              )}
              height={320}
              summary={`${label}의 ${describeDetail(period, date)} ${DETAIL_UNIT[period]}별 발전량 추이.`}
            />
          ) : (
            <InverterTimeTable
              labels={detail.map((point) => point.label)}
              generation={stat.series}
              irradiance={detail.map((point) => point.irradiance)}
              caption={`${label}의 ${DETAIL_UNIT[period]}별 발전량, 일사량 표`}
            />
          )}
        </Card>
      </Reveal>

    </div>
  );
}
