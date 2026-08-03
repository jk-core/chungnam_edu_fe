import { useEffect, useRef, useState } from 'react';
import { EChart } from '@/components/common/EChart';
import { AXIS_NAME_GAP, LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { NOW_HOUR } from '@/mocks/today';
import { SUNRISE_HOUR, SUNSET_HOUR } from '@/mocks/generation';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { EduStats } from '@/mocks/solarEdu';
import { READING_ICONS } from './EduIcons';
import { clockOf, SunPathArt } from './SunPathArt';
import styles from './SolarEdu.module.scss';
import type { EChartsOption } from 'echarts';

const AXIS_FONT = { fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' };

/** 좁은 화면에서도 축과 범례가 겹치지 않는 최소 높이 */
const MIN_CHART_HEIGHT = 240;

/** 곡선을 읽는 법 — 차트 옆에 붙는 해설 */
const READINGS = [
  {
    id: 'angle',
    term: '남중고도가 정점을 만든다',
    body:
      '태양이 높이 뜰수록 햇빛이 모듈 면에 수직으로 닿는다. 같은 양의 빛이 더 좁은 면적에 모이므로 1m² 가 받는 에너지, 곧 일사강도가 커진다. ' +
      '빛이 비스듬히 들어오면 같은 빛다발이 넓게 퍼져 단위 면적당 몫이 줄어든다. 곡선이 정오 무렵 가장 높이 솟는 것은 이 때문이다.',
  },
  {
    id: 'airmass',
    term: '아침·저녁은 대기를 길게 지난다',
    body:
      '해가 낮게 뜨면 빛이 통과해야 하는 공기층이 두꺼워진다. 그 사이 공기 분자와 먼지에 부딪혀 흩어지거나 흡수되면서 지표에 닿는 에너지가 줄어든다. ' +
      '해 뜨는 시각과 지는 시각 근처에서 곡선이 완만하게 눕는 것은 설비가 약해서가 아니라 도달하는 빛 자체가 적기 때문이다.',
  },
  {
    id: 'cloud',
    term: '구름은 곡선에 골을 판다',
    body:
      '매끄러운 종 모양에서 움푹 팬 구간은 대개 구름이 지나간 자리다. 구별하는 법은 간단하다 — 일사 곡선과 발전 곡선이 ' +
      '함께 내려앉았으면 날씨 탓이고, 일사는 그대로인데 발전량만 떨어졌으면 오염·음영·고장을 의심해야 한다.',
  },
];

interface CurveSceneProps {
  stats: EduStats;
}

/**
 * 씬 3 — 하루의 발전 곡선 (SFR-005-03).
 * 발전량과 일사를 겹쳐 그려, 곡선의 모양이 설비가 아니라 햇빛에서 온다는 걸 보이게 한다.
 */
export function CurveScene({ stats }: CurveSceneProps) {
  const palette = useChartPalette();
  const slotRef = useRef<HTMLDivElement>(null);
  // 화면 크기에 맞춰 차트를 늘린다 — echarts 는 퍼센트 높이를 못 받아 실측값을 넘긴다.
  const [chartHeight, setChartHeight] = useState(MIN_CHART_HEIGHT);
  const labels = stats.hourly.map((_, hour) => `${String(hour).padStart(2, '0')}시`);
  const nowIndex = Math.min(labels.length - 1, Math.round(NOW_HOUR));

  useEffect(() => {
    const node = slotRef.current;

    if (!node) return;

    // ResizeObserver 가 넘겨주는 contentRect 는 첫 콜백에서 낡은 값이라 노드를 직접 읽는다.
    const apply = () => setChartHeight(Math.max(MIN_CHART_HEIGHT, node.clientHeight));

    apply();

    const observer = new ResizeObserver(apply);

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const option: EChartsOption = {
    grid: { top: LEGEND_GRID_TOP, right: 56, bottom: 28, left: 60 },
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
      axisLabel: { color: palette.axis, interval: 1, ...AXIS_FONT },
    },
    yAxis: [
      {
        type: 'value',
        name: 'kWh',
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11 },
        splitLine: { lineStyle: { color: palette.grid, type: 'dashed' } },
        axisLabel: { color: palette.axis, ...AXIS_FONT },
      },
      {
        type: 'value',
        name: 'kWh/m²',
        nameGap: AXIS_NAME_GAP,
        nameTextStyle: { color: palette.axis, fontSize: 11 },
        splitLine: { show: false },
        axisLabel: { color: palette.axis, ...AXIS_FONT },
      },
    ],
    series: [
      {
        name: '발전량',
        type: 'bar',
        barMaxWidth: 16,
        itemStyle: { color: palette.generationSoft, borderRadius: [3, 3, 0, 0] },
        data: stats.hourly.map((value, index) => ({
          value,
          itemStyle: index === nowIndex ? { color: palette.generationFocus } : undefined,
        })),
        // 지금 시각은 진한 막대로 이미 드러나므로 기준선에 라벨을 붙이지 않는다.
        // 세로 기준선의 라벨은 글자가 선을 따라 눕거나 벌어져 오히려 읽기 나빠진다.
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: palette.axis, type: 'dashed', width: 1 },
          label: { show: false },
          data: [{ xAxis: nowIndex }],
        },
      },
      {
        name: '일사량',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: palette.irradiance, width: 2.4 },
        data: stats.irradianceSeries,
      },
    ],
  };

  return (
    <div className={styles.scene}>
      <div className={styles.curve}>
        <div className={styles.curve__main}>
          {/* 곡선이 왜 종 모양인지 — 해가 도는 길이 그 답이다 */}
          <div className={styles.curve__sky}>
            <SunPathArt />
          </div>

          <div
            ref={slotRef}
            className={styles.curve__chart}
          >
            <EChart
              className={styles.curve__canvas}
              option={option}
              height={chartHeight}
              summary={`시간대별 발전량과 일사량. 일출 ${SUNRISE_HOUR}시, 일몰 ${SUNSET_HOUR}시 기준 하루 ${formatNumber(stats.dayKwh)}kWh.`}
            />
          </div>
        </div>

        <div className={styles.curve__side}>
          {READINGS.map((reading) => (
            <div key={reading.id} className={styles.term}>
              <p className={styles.term__name}>
                <span className={styles.term__icon}>{READING_ICONS[reading.id]}</span>
                {reading.term}
              </p>
              <p className={styles.term__body}>{reading.body}</p>
            </div>
          ))}

          <p className={styles.curve__note}>
            진하게 칠한 막대가 지금 시각입니다. 오늘 일출 {clockOf(SUNRISE_HOUR)} · 일몰{' '}
            {clockOf(SUNSET_HOUR)} — 해가 떠 있는 약 {formatNumber(SUNSET_HOUR - SUNRISE_HOUR, 1)}시간 동안만
            곡선이 그려집니다.
          </p>
        </div>
      </div>
    </div>
  );
}
