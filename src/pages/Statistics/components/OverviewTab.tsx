import { useMemo, useState } from 'react';
import { Card } from '@/components/common/Card';
import { EChart } from '@/components/common/EChart';
import {
  describeDetail,
  DETAIL_TITLE,
  DETAIL_UNIT,
  getDetailTrend,
  PERIOD_META,
  pickEnergyUnit,
} from '@/mocks/generation';
import { childKindOf, getNodePath, KIND_LABEL } from '@/mocks/tree';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, seriesPalette, topLegend } from '@/utils/chart';
import { MSG } from '@/configs/messages';
import { exportCsv } from '@/utils/export';
import { formatCapacity, formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { formatShort } from '@/utils/date';
import { getChildStats, getNodeStat } from '@/mocks/nodeStats';
import { useChartPalette } from '@/hooks/useChartPalette';
import { usePlantScope } from '@/hooks/usePlantScope';
import { useSelectNode } from '@/stores/plantStore';
import { useStatisticsDate } from '@/stores/filterStore';
import type { PeriodKey } from '@/mocks/generation';
import type { CsvColumn } from '@/utils/export';
import styles from '../Statistics.module.scss';
import { ChildGrid } from './ChildGrid';
import { InverterTimeTable } from './InverterTimeTable';
import { PeriodFilter } from './PeriodFilter';
import type { EChartsOption } from 'echarts';

type DetailView = 'chart' | 'table';

const DETAIL_VIEW_OPTIONS: { value: DetailView; label: string }[] = [
  { value: 'chart', label: '차트' },
  { value: 'table', label: '표' },
];

/** 색이 여덟 개를 넘어 돌 때 선 모양으로 한 번 더 가른다 (COR-003-03) */
const DASH = ['solid', 'dashed', 'dotted'] as const;

export function OverviewTab() {
  const [period, setPeriod] = useState<PeriodKey>('day');
  const [detailView, setDetailView] = useState<DetailView>('chart');
  const [date, setDate] = useStatisticsDate();
  const { node, label } = usePlantScope();
  const selectNode = useSelectNode();
  const palette = useChartPalette();
  const childColors = seriesPalette(palette);
  const meta = PERIOD_META[period];

  const stat = useMemo(() => getNodeStat(node, period, date), [node, period, date]);
  const childStats = useMemo(() => getChildStats(node, period, date), [node, period, date]);

  const detail = getDetailTrend(period, date);
  const path = getNodePath(node.id);
  const childKind = childKindOf(node);

  const totalUnit = pickEnergyUnit(stat.generationKwh);
  const capacity = formatCapacity(node.capacityKw);
  const bestIndex = stat.series.reduce((best, value, index) => (value > stat.series[best] ? index : best), 0);
  // 조회 단위(시간·일·월)에 맞춘 상세 추이 — 차트와 표가 같은 값을 본다.
  const detailPeakIndex = stat.series.reduce((best, value, index) => (value > stat.series[best] ? index : best), 0);
  const detailTotal = stat.series.reduce((sum, value) => sum + value, 0);
  const detailUnit = pickEnergyUnit(Math.max(...stat.series, 1));
  // 발전량이 왜 많고 적었는지는 그날 들어온 햇빛의 양이 답한다.
  const totalIrradiance = detail.reduce((sum, point) => sum + point.irradiance, 0);

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

  /** 발전량 막대 + 일사량 선을 겹친 차트. 시간대별과 시점별이 같은 모양을 공유한다. */
  const comboOption = (
    labels: string[],
    values: number[],
    irradiance: number[],
    divider: number,
    unit: string,
    irradianceUnit: string,
  ): EChartsOption => ({
    grid: { top: LEGEND_GRID_TOP, right: 52, bottom: 30, left: 58 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
    },
    legend: topLegend(palette, ['발전량', '일사량']),
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
      <PeriodFilter
        period={period}
        onPeriodChange={setPeriod}
        date={date}
        onDateChange={setDate}
        onDownload={download}
      />

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
            <div>
              <dt>기대 발전량</dt>
              <dd>
                {formatNumber(stat.expectedKwh / totalUnit.divider, 2)}
                <span className={styles.infoGrid__unit}>{totalUnit.unit}</span>
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
        </Card>
      </Reveal>

      {childKind ? (
        <Reveal delay={0.06}>
          <Card
            eyebrow="Children"
            title={`${KIND_LABEL[childKind]}별 발전`}
            description={
              node.kind === 'root'
                ? `이상이 있는 발전소를 앞세워 ${childStats.length}개소를 보여 줍니다. 카드를 누르면 그 발전소로 내려갑니다.`
                : `${node.name} 아래 ${KIND_LABEL[childKind]} ${childStats.length}개입니다. 카드를 누르면 그 설비로 내려갑니다.`
            }
          >
            <ChildGrid
              stats={childStats}
              selectedId={node.id}
              dateLabel={formatShort(date)}
              emptyLabel={`${label} 아래에는 더 내려갈 설비가 없습니다.`}
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
          description={`${describeDetail(period, date)} · 최고는 ${detail[detailPeakIndex]?.label ?? '—'}, 합계 ${formatNumber(detailTotal / detailUnit.divider, 2)}${detailUnit.unit}입니다. 표로 바꾸면 같은 값을 숫자로 봅니다.`}
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
              )}
              height={320}
              summary={`${label}의 ${describeDetail(period, date)} ${DETAIL_UNIT[period]}별 발전량 추이.`}
            />
          ) : (
            <InverterTimeTable
              labels={detail.map((point) => point.label)}
              generation={stat.series}
              irradiance={detail.map((point) => point.irradiance)}
              expectedKwh={stat.expectedKwh}
              caption={`${label}의 ${DETAIL_UNIT[period]}별 발전량, 기대 발전량, 일사량 표`}
            />
          )}
        </Card>
      </Reveal>
    </div>
  );
}
