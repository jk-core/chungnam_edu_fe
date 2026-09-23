import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Card } from '@/components/common/Card';
import { EChart } from '@/components/common/EChart';
import { EmptyState } from '@/components/common/EmptyState';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import { useDiagnosisRange } from '@/stores/filterStore';
import { useDiagnosisScope } from '@/hooks/useDiagnosisScope';
import type { DiagnosisRawPoint } from '@/service/diagnosis/type';
import styles from '../../AiDiagnosis.module.scss';
import { useDiagnosisRaw } from '../hooks/useDiagnosisRaw';
import { metricText, readTrend, TREND_META } from './trendMetric';
import { trendTooltip } from './trendTooltip';
import type { TrendMetric } from './trendMetric';
import type { EChartsOption } from 'echarts';

type Density = 'summary' | 'detail';

const METRIC_OPTIONS: { value: TrendMetric; label: string }[] = [
  { value: 'power', label: '전력' },
  { value: 'voltage', label: '전압' },
  { value: 'current', label: '전류' },
];

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: 'summary', label: '요약' },
  { value: 'detail', label: '상세' },
];

/**
 * 인버터 전력·전압·전류 추이 (SFR-013-09).
 *
 * 일자별 판정이 "어느 날 처졌다"를 알려 준다면, 이 그림은 기간 전체에서 어느 구간이
 * 정상범위를 벗어났는지 한눈에 보여 준다. 정상 범위는 **서버가 준 상·하한**을 띠로 깔고,
 * 그 위에 측정값과 두 예측값(물리모델·머신러닝)을 얹는다 — 두 모델이 갈리는 지점이 진단의 단서다.
 *
 * 인버터나 스트링까지 좁혔을 때만 나온다 — 계측 추이는 그 두 계층에서만 나오는 값이라,
 * 발전소 전체를 보고 있을 때는 그릴 것이 없다.
 */
export function InverterTrendChart() {
  const { target } = useDiagnosisScope();
  const palette = useChartPalette();
  const [range] = useDiagnosisRange();
  const [metric, setMetric] = useState<TrendMetric>('power');
  const [density, setDensity] = useState<Density>('summary');

  const { points, outOfRangeDays, isLoading, supported } = useDiagnosisRaw(
    target.id,
    dayjs(range.start).format('YYYY-MM-DD'),
    dayjs(range.end).format('YYYY-MM-DD'),
  );

  /*
   * 요약은 하루의 정점만, 상세는 수집된 값 전부를 그린다.
   * 한 달을 상세로 펼치면 수백 점이 넘어 모양이 뭉개진다 — 훑을 때와 파고들 때를 갈라 둔다.
   * 정점은 전력 기준으로 고른다 — 같은 시점의 전압·전류를 함께 보아야 값이 서로 맞는다.
   */
  const visible = useMemo(() => {
    if (density === 'detail') return points;

    const byDate = new Map<string, DiagnosisRawPoint>();

    points.forEach((point) => {
      const date = dayjs(point.gathDtm).format('YYYY-MM-DD');
      const best = byDate.get(date);

      if (!best || (point.pvPwr ?? 0) > (best.pvPwr ?? 0)) byDate.set(date, point);
    });

    return [...byDate.values()];
  }, [points, density]);

  const meta = TREND_META[metric];
  // 분·초까지 적는다 — 수집 주기가 분 단위라 시각까지만 적으면 같은 시의 점들이 구분되지 않는다.
  const labels = visible.map((point) => dayjs(point.gathDtm).format('MM.DD HH:mm:ss'));

  const readings = visible.map((point) => readTrend(point, metric));
  /*
    정상 범위는 상·하한 사이의 띠다. 아래 선을 투명하게 깔고 그 위에 폭만큼 쌓아 색을 준다.
    한쪽이라도 안 왔으면 띠를 그리지 않는다 — 한 짝만으로는 범위가 되지 않는다.
  */
  const hasBand = readings.map((reading) => reading.lower !== null && reading.upper !== null);
  const bandLow = readings.map((reading, index) => (hasBand[index] ? reading.lower : null));
  const bandWidth = readings.map((reading, index) => (
    hasBand[index] ? Math.max(0, (reading.upper ?? 0) - (reading.lower ?? 0)) : null
  ));
  // 고장으로 분류된 구간만 남긴 선 — 나머지는 끊어 둔다.
  const faulty = visible.map((point, index) => (
    point.faultCode !== null && point.faultCode > 0 ? readings[index].measured : null
  ));

  const option: EChartsOption = {
    grid: { top: LEGEND_GRID_TOP, right: 56, bottom: 64, left: 58 },
    legend: topLegend(palette, ['정상 범위', meta.label, '물리모델 예측', 'ML 예측', '고장코드 이상', '일사량']),
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const index = Number(list[0]?.dataIndex ?? 0);
        const point = visible[index];
        const reading = readings[index];

        if (!point || !reading) return '';

        const gap = reading.measured !== null && reading.ml !== null && reading.ml > 0
          ? ((reading.measured - reading.ml) / reading.ml) * 100
          : null;

        return trendTooltip({
          title: dayjs(point.gathDtm).format('MM.DD HH:mm:ss'),
          rows: [
            { label: meta.label, value: metricText(reading.measured, meta.digits, meta.unit), strong: true },
            { label: '정상범위', value: `${metricText(reading.lower, meta.digits)} ~ ${metricText(reading.upper, meta.digits, meta.unit)}` },
            { label: '물리모델', value: metricText(reading.phys, meta.digits, meta.unit) },
            { label: 'ML 예측', value: metricText(reading.ml, meta.digits, meta.unit) },
            {
              label: 'ML 대비',
              value: gap === null ? '—' : `${gap > 0 ? '+' : ''}${formatNumber(gap, 1)}%`,
              color: gap !== null && gap < -10 ? palette.critical : undefined,
            },
            { label: '일사량', value: metricText(point.slpIrrad, 0, ' W/m²') },
          ],
          fault: { code: point.faultCode, name: point.faultCodeName },
          palette,
        });
      },
    },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 11, hideOverlap: true },
    },
    yAxis: [
      {
        type: 'value',
        name: meta.unit,
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11, padding: [0, 0, 0, -30] },
        splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
        axisLabel: { color: palette.axis, fontSize: 11 },
      },
      {
        type: 'value',
        name: 'W/m²',
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11 },
        splitLine: { show: false },
        axisLabel: { color: palette.axis, fontSize: 11 },
      },
    ],
    // 기간이 길면 훑어보기 어렵다 — 아래 손잡이로 자르고 Shift + 휠로 좁힌다.
    dataZoom: [
      { type: 'inside', zoomOnMouseWheel: 'shift', moveOnMouseWheel: false },
      {
        type: 'slider',
        height: 18,
        bottom: 12,
        borderColor: palette.border,
        fillerColor: palette.generationSoft,
        handleStyle: { color: palette.generation },
        textStyle: { color: palette.axis, fontSize: 10 },
      },
    ],
    series: [
      /*
        띠는 배경이므로 모든 선 아래에 깐다 — line 계열의 기본 z 가 2 라, 그대로 두면
        일사량(z:1)처럼 낮게 깐 선이 반투명한 띠에 덮여 흐릿하게 보인다.
      */
      {
        name: '정상 범위 하단',
        type: 'line',
        stack: 'band',
        symbol: 'none',
        silent: true,
        lineStyle: { opacity: 0 },
        areaStyle: { opacity: 0 },
        data: bandLow,
        tooltip: { show: false },
        legendHoverLink: false,
        z: 0,
      },
      {
        name: '정상 범위',
        type: 'line',
        stack: 'band',
        symbol: 'none',
        silent: true,
        lineStyle: { opacity: 0 },
        areaStyle: { color: palette.okSoft, opacity: 0.9 },
        data: bandWidth,
        tooltip: { show: false },
        z: 0,
      },
      {
        name: meta.label,
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: palette.generation, width: 2 },
        itemStyle: { color: palette.generation },
        data: readings.map((reading) => reading.measured),
        z: 3,
      },
      {
        name: '물리모델 예측',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: palette.axis, width: 1.4, type: 'dotted' },
        itemStyle: { color: palette.axis },
        data: readings.map((reading) => reading.phys),
        z: 2,
      },
      {
        name: 'ML 예측',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: palette.compare, width: 1.6, type: 'dashed' },
        itemStyle: { color: palette.compare },
        data: readings.map((reading) => reading.ml),
        z: 2,
      },
      {
        name: '고장코드 이상',
        type: 'line',
        smooth: true,
        showSymbol: false,
        connectNulls: false,
        lineStyle: { color: palette.critical, width: 2.4 },
        itemStyle: { color: palette.critical },
        data: faulty,
        z: 4,
      },
      {
        name: '일사량',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: palette.irradiance, width: 1.6, type: 'dashed' },
        itemStyle: { color: palette.irradiance },
        data: visible.map((point) => point.slpIrrad),
        z: 2,
      },
    ],
  };

  // 인버터·스트링까지 좁히지 않았으면 그릴 것이 없다.
  if (!supported) return null;

  return (
    <Reveal delay={0.04}>
      <Card
        title="전력 · 전압 · 전류 추이"
        description={outOfRangeDays > 0
          ? `초록 띠는 서버가 준 정상 범위, 붉은 선은 AI가 고장으로 분류한 구간입니다 · 조회 기간 중 ${formatNumber(outOfRangeDays)}일이 정상범위를 벗어났습니다`
          : '초록 띠는 서버가 준 정상 범위, 붉은 선은 AI가 고장으로 분류한 구간입니다'}
        action={(
          <div className={styles.dailyActions}>
            <SegmentedControl label="측정값" size="sm" options={METRIC_OPTIONS} value={metric} onChange={setMetric} />
            <SegmentedControl label="촘촘함" size="sm" options={DENSITY_OPTIONS} value={density} onChange={setDensity} />
          </div>
        )}
      >
        {visible.length === 0 ? (
          <EmptyState
            title={isLoading ? '계측 추이를 불러오는 중입니다' : '계측 추이가 없습니다'}
            description={isLoading ? '' : '이 설비는 조회 기간에 수집된 값이 없습니다.'}
          />
        ) : (
          <>
            <EChart
              option={option}
              height={340}
              summary={`${target.name}의 ${meta.label} 추이. 초록 띠가 정상 범위다.`}
            />
            <p className={styles.trendHint}>아래 손잡이로 기간을 좁히거나 Shift + 마우스 휠로 확대합니다.</p>
          </>
        )}
      </Card>
    </Reveal>
  );
}
