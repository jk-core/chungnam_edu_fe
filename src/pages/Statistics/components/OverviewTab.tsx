import { useMemo, useState } from 'react';
import { Card } from '@/components/common/Card';
import { EChart } from '@/components/common/EChart';
import {
  describeDetail,
  DETAIL_UNIT,
  getDetailTrend,
  getHourlyTrend,
  PERIOD_META,
  pickEnergyUnit,
} from '@/mocks/generation';
import { childKindOf, getNodePath, KIND_LABEL } from '@/mocks/tree';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { formatCapacity, formatNumber, formatPercent } from '@/utils/format';
import { formatShort } from '@/utils/date';
import { getChildStats, getNodeStat } from '@/mocks/nodeStats';
import { useChartPalette } from '@/hooks/useChartPalette';
import { usePlantScope } from '@/hooks/usePlantScope';
import { useSelectNode } from '@/stores/plantStore';
import { useStatisticsDate } from '@/stores/filterStore';
import type { PeriodKey } from '@/mocks/generation';
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

export function OverviewTab() {
  const [period, setPeriod] = useState<PeriodKey>('day');
  const [detailView, setDetailView] = useState<DetailView>('chart');
  const [date, setDate] = useStatisticsDate();
  const { node, label } = usePlantScope();
  const selectNode = useSelectNode();
  const palette = useChartPalette();
  const meta = PERIOD_META[period];

  const stat = useMemo(() => getNodeStat(node, period, date), [node, period, date]);
  const childStats = useMemo(() => getChildStats(node, period, date), [node, period, date]);

  const detail = getDetailTrend(period, date);
  const hourlyTrend = getHourlyTrend(date);
  const path = getNodePath(node.id);
  const childKind = childKindOf(node);

  const totalUnit = pickEnergyUnit(stat.generationKwh);
  const capacity = formatCapacity(node.capacityKw);
  const bestIndex = stat.series.reduce((best, value, index) => (value > stat.series[best] ? index : best), 0);
  const hourlyPeakIndex = stat.hourly.reduce((best, value, index) => (value > stat.hourly[best] ? index : best), 0);
  const hourlyTotal = stat.hourly.reduce((sum, value) => sum + value, 0);
  const hourlyUnit = pickEnergyUnit(Math.max(...stat.hourly, 1));
  const detailUnit = pickEnergyUnit(Math.max(...stat.series, 1));

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

  return (
    <div className={styles.tab}>
      <PeriodFilter period={period} onPeriodChange={setPeriod} date={date} onDateChange={setDate} />

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
              <dt>기대 대비 달성률</dt>
              <dd className={stat.pr < 0.8 ? styles.deltaDown : styles.deltaUp}>{formatPercent(stat.pr, 1)}</dd>
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

      <Reveal delay={0.1}>
        <Card
          eyebrow="Hourly"
          title="시간대별 발전량"
          description={`${formatShort(date)} 하루를 시간 단위로 폈습니다. 최고는 ${
            hourlyTrend[hourlyPeakIndex]?.label ?? '—'
          }, 하루 합계 ${formatNumber(hourlyTotal / hourlyUnit.divider, 2)}${hourlyUnit.unit}입니다.`}
        >
          <EChart
            option={comboOption(
              hourlyTrend.map((point) => point.label),
              stat.hourly,
              hourlyTrend.map((point) => point.irradiance),
              hourlyUnit.divider,
              hourlyUnit.unit,
              'kWh/m²',
            )}
            height={320}
            summary={`${label}의 ${formatShort(date)} 시간대별 발전량. 최고 ${
              hourlyTrend[hourlyPeakIndex]?.label ?? '—'
            }, 합계 ${formatNumber(hourlyTotal / hourlyUnit.divider, 2)}${hourlyUnit.unit}.`}
          />
        </Card>
      </Reveal>

      <Reveal delay={0.14}>
        <Card
          eyebrow="Detail"
          title="시점별 발전 데이터"
          description={`${meta.label} 조회라 ${DETAIL_UNIT[period]} 단위로 폈습니다 · ${describeDetail(period, date)}`}
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
              pr={stat.pr}
              caption={`${label}의 ${DETAIL_UNIT[period]}별 발전량, 기대 발전량, 달성률, 일사량 표`}
            />
          )}
        </Card>
      </Reveal>
    </div>
  );
}
