import { useMemo, useState } from 'react';
import { Card } from '@/components/common/Card';
import { CHANNEL_BY_KEY, CHANNELS, getRawSeries, scaleToInverter, toChannelSeries } from '@/mocks/collection';
import { EChart } from '@/components/common/EChart';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { StatCard } from '@/components/common/StatCard';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import { useCollectionDate } from '@/stores/filterStore';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { ChannelKey } from '@/interface/collection';
import styles from '../Collection.module.scss';
import { CollectionFilter } from './CollectionFilter';
import type { EChartsOption } from 'echarts';

/** 왼쪽 축에 놓을 수 있는 주 채널 */
const PRIMARY_OPTIONS: { value: ChannelKey; label: string }[] = [
  { value: 'power', label: '발전전력' },
  { value: 'dcVoltage', label: '직류전압' },
  { value: 'dcCurrent', label: '직류전류' },
  { value: 'moduleTemp', label: '모듈온도' },
  { value: 'acVoltage', label: '계통전압' },
];

export function TrendTab() {
  const { plant, inverter, label } = usePlantScope();
  const [date] = useCollectionDate();
  const [primary, setPrimary] = useState<ChannelKey>('power');
  const [withIrradiance, setWithIrradiance] = useState(true);
  const palette = useChartPalette();

  const points = useMemo(() => {
    const base = getRawSeries(plant?.id ?? null, date);

    if (!inverter || !plant) return base;

    return scaleToInverter(base, inverter.capacityKw / plant.capacityKw);
  }, [plant, inverter, date]);
  const channel = CHANNEL_BY_KEY.get(primary)!;
  const values = toChannelSeries(points, primary);
  const collected = values.filter((value) => value !== null) as number[];
  const missing = values.length - collected.length;
  const peak = collected.length > 0 ? Math.max(...collected) : 0;
  const peakIndex = values.findIndex((value) => value === peak);
  const average = collected.length > 0 ? collected.reduce((sum, value) => sum + value, 0) / collected.length : 0;

  const option: EChartsOption = {
    grid: { top: LEGEND_GRID_TOP, right: 56, bottom: 74, left: 60 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
    },
    legend: topLegend(palette),
    // 96개 점을 다 펼치면 촘촘하니 확대·이동할 수 있게 둔다.
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      {
        type: 'slider',
        height: 22,
        bottom: 12,
        borderColor: palette.border,
        fillerColor: palette.generationSoft,
        handleStyle: { color: palette.surface, borderColor: palette.border },
        textStyle: { color: palette.axis, fontSize: 10 },
      },
    ],
    xAxis: {
      type: 'category',
      data: points.map((point) => point.time),
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
    },
    yAxis: [
      {
        type: 'value',
        name: channel.unit,
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11, padding: [0, 0, 0, -30] },
        splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
        axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
      },
      {
        type: 'value',
        name: 'W/m²',
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11 },
        splitLine: { show: false },
        axisLabel: { color: palette.axis, fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' },
      },
    ],
    series: [
      {
        name: channel.label,
        type: 'line',
        smooth: true,
        symbol: 'none',
        // 결측 구간은 선을 잇지 않아 끊긴 자리가 그대로 보이게 한다.
        connectNulls: false,
        lineStyle: { color: palette.generation, width: 2 },
        itemStyle: { color: palette.generation },
        areaStyle: { color: palette.generationSoft },
        data: values,
        ...(channel.normalRange
          ? {
            markArea: {
              silent: true,
              itemStyle: { color: palette.generationSoft, opacity: 0.35 },
              data: [[{ yAxis: channel.normalRange[0] }, { yAxis: channel.normalRange[1] }]],
            },
          }
          : {}),
      },
      ...(withIrradiance
        ? [
          {
            name: '일사량',
            type: 'line' as const,
            yAxisIndex: 1,
            smooth: true,
            symbol: 'none' as const,
            connectNulls: false,
            lineStyle: { color: palette.irradiance, width: 1.6, type: 'dashed' as const },
            itemStyle: { color: palette.irradiance },
            data: toChannelSeries(points, 'irradiance'),
          },
        ]
        : []),
    ],
  };

  return (
    <div className={styles.tab}>
      <CollectionFilter>
        <SegmentedControl
          label="측정 항목"
          size="sm"
          options={PRIMARY_OPTIONS}
          value={primary}
          onChange={setPrimary}
        />
        <button
          type="button"
          className={cn(styles.overlayToggle, { [styles['overlayToggle--on']]: withIrradiance })}
          onClick={() => setWithIrradiance((prev) => !prev)}
          aria-pressed={withIrradiance}
        >
          일사량 겹쳐보기
        </button>
      </CollectionFilter>

      <Reveal>
        <Card
          eyebrow="Trend"
          title={`${channel.label} 추이`}
          description={`${label} · 15분 주기로 들어온 값입니다. 가로 막대를 끌거나 차트 위에서 스크롤하면 구간을 좁혀 볼 수 있습니다.${
            missing > 0 ? ` 수집되지 않은 ${missing}건은 선이 끊긴 자리로 표시했습니다.` : ''
          }`}
        >
          <EChart
            option={option}
            height={380}
            summary={`${label}의 ${channel.label} 하루 추이. 평균 ${formatNumber(average, 1)}${channel.unit}, 최고 ${formatNumber(
              peak,
              1,
            )}${channel.unit}, 결측 ${missing}건.`}
          />
        </Card>
      </Reveal>

      <div className={styles.grid3}>
        <Reveal delay={0.06}>
          <StatCard label={`${channel.label} 평균`} value={average} unit={channel.unit} fractionDigits={1} accent />
        </Reveal>
        <Reveal delay={0.12}>
          <StatCard
            label={`${channel.label} 최고`}
            value={peak}
            unit={channel.unit}
            fractionDigits={1}
            meterLabel={peakIndex >= 0 ? `${points[peakIndex].time} 기록` : undefined}
            meter={1}
          />
        </Reveal>
        <Reveal delay={0.18}>
          <StatCard
            label="수집 성공"
            value={(collected.length / values.length) * 100}
            unit="%"
            fractionDigits={1}
            meter={collected.length / values.length}
            meterLabel={`결측 ${missing}건`}
          />
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <Card eyebrow="Channels" title="수집 채널" description="이 시스템이 15분마다 받아 오는 계측 항목입니다." variant="outline">
          <ul className={styles.channelList}>
            {CHANNELS.map((item) => (
              <li key={item.key} className={styles.channelList__item}>
                <span className={styles.channelList__dot} style={{ backgroundColor: item.color }} />
                <span className={styles.channelList__label}>{item.label}</span>
                <span className={styles.channelList__unit}>{item.unit}</span>
                <span className={styles.channelList__range}>
                  {item.normalRange ? `정상 ${item.normalRange[0]} ~ ${item.normalRange[1]}` : '범위 제한 없음'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>
    </div>
  );
}
