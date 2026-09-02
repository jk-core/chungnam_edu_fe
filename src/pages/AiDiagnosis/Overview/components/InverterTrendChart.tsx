import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Card } from '@/components/common/Card';
import { EChart } from '@/components/common/EChart';
import { EmptyState } from '@/components/common/EmptyState';
import { faultCodeLabel } from '@/mocks/faultCodes';
import { getUnitTrend, readTrend, TREND_META } from '@/mocks/diagnosisTrend';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import { useDiagnosisRange } from '@/stores/filterStore';
import { useDiagnosisScope } from '@/hooks/useDiagnosisScope';
import type { DiagTrendPoint, TrendMetric } from '@/mocks/diagnosisTrend';
import styles from '../../AiDiagnosis.module.scss';
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

/** 기대값에서 이만큼 벗어나기 전까지는 정상으로 본다 (±%) */
const NORMAL_MARGIN = 0.12;

/**
 * 인버터 전력·전압·전류 추이 (SFR-013-09).
 *
 * 일자별 판정이 "어느 날 처졌다"를 알려 준다면, 이 그림은 기간 전체에서 어느 구간이
 * 기대값을 벗어났는지 한눈에 보여 준다. 정상 범위를 띠로 깔고 그 위에 측정값을 얹되,
 * AI 가 고장으로 분류한 구간만 붉게 끊어 그려 눈이 그리로 먼저 가게 한다.
 *
 * 인버터나 스트링까지 좁혔을 때만 나온다 — 계측 추이는 그 두 계층에서만 나오는 값이라,
 * 발전소 전체를 보고 있을 때는 그릴 것이 없다. 낼지 말지를 이 부품이 스스로 정하므로 부르는
 * 쪽은 조회 대상을 알 필요가 없다.
 *
 * 고른 계층 자신의 값을 그린다 — 스트링을 골랐는데 상위 인버터를 그리면, 형제 스트링이
 * 섞인 값을 그 스트링의 것으로 읽게 된다.
 */
export function InverterTrendChart() {
  const { target } = useDiagnosisScope();
  const palette = useChartPalette();
  const [range] = useDiagnosisRange();
  const [metric, setMetric] = useState<TrendMetric>('power');
  const [density, setDensity] = useState<Density>('summary');

  const unitId = target.kind === 'inverter' || target.kind === 'string' ? target.id : null;

  const points = useMemo<DiagTrendPoint[]>(
    () => (unitId ? getUnitTrend(unitId, range.start, range.end) : []),
    [unitId, range.start, range.end],
  );

  /*
   * 요약은 하루의 정점만, 상세는 정시 값 전부를 그린다.
   * 한 달을 상세로 펼치면 500 점이 넘어 모양이 뭉개진다 — 훑을 때와 파고들 때를 갈라 둔다.
   */
  const visible = useMemo(() => {
    if (density === 'detail') return points;

    const byDate = new Map<string, DiagTrendPoint>();

    points.forEach((point) => {
      const best = byDate.get(point.date);

      if (!best || point.powerKw > best.powerKw) byDate.set(point.date, point);
    });

    return [...byDate.values()];
  }, [points, density]);

  const meta = TREND_META[metric];
  const labels = visible.map((point) => (density === 'detail'
    ? dayjs(point.time).format('M/D HH시')
    : dayjs(point.date).format('M/D')));

  const measured = visible.map((point) => readTrend(point, metric).measured);
  const expected = visible.map((point) => readTrend(point, metric).expected);
  // 정상 범위는 기대값 둘레의 띠다. 아래 선을 투명하게 깔고 그 위에 폭만큼 쌓아 색을 준다.
  const bandLow = expected.map((value) => Math.round(value * (1 - NORMAL_MARGIN) * 10) / 10);
  const bandWidth = expected.map((value) => Math.round(value * NORMAL_MARGIN * 2 * 10) / 10);
  // 고장으로 분류된 구간만 남긴 선 — 나머지는 끊어 둔다.
  const faulty = visible.map((point, index) => (point.faultCode > 0 ? measured[index] : null));

  const option: EChartsOption = {
    grid: { top: LEGEND_GRID_TOP, right: 56, bottom: 64, left: 58 },
    legend: topLegend(palette, ['정상 범위', meta.label, '고장코드 이상', '일사량']),
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

        if (!point) return '';

        const { measured: value, expected: guess } = readTrend(point, metric);
        const gap = guess > 0 ? ((value - guess) / guess) * 100 : 0;

        return [
          `<strong>${dayjs(point.time).format('M월 D일 HH시')}</strong>`,
          `측정 ${formatNumber(value, meta.digits)}${meta.unit} · 기대 ${formatNumber(guess, meta.digits)}${meta.unit}`,
          `<span style="color:${gap < -10 ? palette.critical : palette.text}">편차 ${gap > 0 ? '+' : ''}${formatNumber(gap, 1)}%</span>`,
          `일사량 ${formatNumber(point.irradianceWm2)}W/m²`,
          `진단 ${faultCodeLabel(point.faultCode)}`,
        ].join('<br/>');
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
      },
      {
        name: meta.label,
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: palette.generation, width: 2 },
        itemStyle: { color: palette.generation },
        data: measured,
        z: 3,
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
        data: visible.map((point) => point.irradianceWm2),
        z: 2,
      },
    ],
  };

  // 인버터·스트링까지 좁히지 않았으면 그릴 것이 없다.
  if (!unitId) return null;

  return (
    <Reveal delay={0.04}>
      <Card
        title="전력 · 전압 · 전류 추이"
        description="버튼으로 측정값을 바꿔 봅니다 · 초록 띠는 기대값 둘레의 정상 범위, 붉은 선은 AI가 고장으로 분류한 구간입니다"
        action={(
          <div className={styles.dailyActions}>
            <SegmentedControl label="측정값" size="sm" options={METRIC_OPTIONS} value={metric} onChange={setMetric} />
            <SegmentedControl label="촘촘함" size="sm" options={DENSITY_OPTIONS} value={density} onChange={setDensity} />
          </div>
        )}
      >
        {visible.length === 0 ? (
          <EmptyState
            title="계측 추이가 없습니다"
            description="이 계층에는 예측 모델이 도는 인버터가 없습니다."
          />
        ) : (
          <>
            <EChart
              option={option}
              height={340}
              summary={`${target.name}의 ${meta.label} 추이. 정상 범위는 기대값 ±${Math.round(NORMAL_MARGIN * 100)}%.`}
            />
            <p className={styles.trendHint}>아래 손잡이로 기간을 좁히거나 Shift + 마우스 휠로 확대합니다.</p>
          </>
        )}
      </Card>
    </Reveal>
  );
}
