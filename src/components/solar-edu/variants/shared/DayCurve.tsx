import { useEffect, useRef, useState } from 'react';
import { EChart } from '@/components/common/EChart';
import { LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { energyText } from '@/mocks/eduContent';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { EduStats } from '@/mocks/solarEdu';
import styles from './DayCurve.module.scss';
import type { EChartsOption } from 'echarts';

const AXIS_FONT = { fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' };

/**
 * 좁은 화면에서도 축과 범례가 겹치지 않는 최소 높이.
 * `DayCurve.module.scss` 의 `.slot` 바닥과 같은 값이어야 한다 — 한쪽만 고치면 그림이
 * 칸 밖으로 나와 아래 글 위에 겹쳐 그려진다.
 */
const MIN_HEIGHT = 140;

interface DayCurveProps {
  stats: EduStats;
  /** 일사량 점선을 함께 그릴지 */
  showIrradiance?: boolean;
  /** 지금 이 순간을 짚는 세로선을 세울지 */
  showNow?: boolean;
}

/**
 * 오늘 하루의 발전 곡선 — 제목도 설명도 없는 곡선 그 자체.
 *
 * 현행 `DayCurvePanel` 은 제목·설명 덩이를 함께 그리고 콘텐츠 조각(`DayContent`)을 요구한다.
 * 시안들은 곡선을 저마다 다른 자리에 다른 제목으로 끼워 넣으므로, 그 껍데기가 오히려 방해가 된다.
 * 여기서는 곡선만 내주고 껍데기는 쓰는 쪽이 정한다.
 *
 * 세로 눈금을 두지 않는 것은 현행과 같다 — 값을 하나씩 읽는 그림이 아니라 하루의 모양을 보는 그림이다.
 */
export function DayCurve({ stats, showIrradiance = false, showNow = true }: DayCurveProps) {
  const palette = useChartPalette();
  const slotRef = useRef<HTMLDivElement>(null);
  // echarts 는 퍼센트 높이를 못 받아 칸을 실측해 넘긴다.
  const [height, setHeight] = useState(MIN_HEIGHT);
  const labels = stats.hourly.map((_, hour) => `${String(hour).padStart(2, '0')}시`);
  const nowIndex = Math.min(labels.length - 1, Math.max(0, stats.nowHour));

  useEffect(() => {
    const node = slotRef.current;

    if (!node) return;

    // ResizeObserver 가 넘겨주는 contentRect 는 첫 콜백에서 낡은 값이라 노드를 직접 읽는다.
    const apply = () => setHeight(Math.max(MIN_HEIGHT, node.clientHeight));

    apply();

    const observer = new ResizeObserver(apply);

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const option: EChartsOption = {
    grid: { top: showIrradiance ? LEGEND_GRID_TOP : 12, right: 16, bottom: 26, left: 16 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
    },
    legend: showIrradiance ? topLegend(palette, ['발전량', '일사량']) : { show: false },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, interval: 2, ...AXIS_FONT },
    },
    // 일사량을 끄면 보조축도 함께 지운다 — 남겨 두면 series 의 yAxisIndex 가 빈 축을 가리킨다.
    yAxis: showIrradiance
      ? [{ type: 'value', show: false }, { type: 'value', show: false }]
      : [{ type: 'value', show: false }],
    series: [
      {
        name: '발전량',
        type: 'line',
        smooth: true,
        symbol: 'none',
        // 범례 색은 itemStyle 을 따른다. lineStyle 만 주면 범례가 기본 팔레트 색으로 어긋난다.
        itemStyle: { color: palette.generation },
        lineStyle: { color: palette.generation, width: 2.8 },
        areaStyle: { color: palette.generationSoft, opacity: 0.45 },
        data: stats.hourly,
        markLine: showNow
          ? {
            silent: true,
            symbol: 'none',
            lineStyle: { color: palette.caution, width: 2 },
            label: {
              show: true,
              formatter: '지금',
              /*
                격자 **안쪽** 위에 붙인다.
                바깥(`end`)에 두면 이름표가 격자 위로 더 올라가 위 여백이 좁은 칸에서는
                글자 윗머리가 잘린다. 여백을 늘리면 곡선이 그만큼 눌린다.
              */
              position: 'insideEndTop',
              distance: 4,
              color: palette.caution,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'Pretendard Variable, sans-serif',
            },
            data: [{ xAxis: nowIndex }],
          }
          : undefined,
      },
      ...(showIrradiance
        ? [{
          name: '일사량',
          type: 'line' as const,
          yAxisIndex: 1,
          smooth: true,
          symbol: 'none' as const,
          itemStyle: { color: palette.irradiance },
          lineStyle: { color: palette.irradiance, width: 2, type: 'dashed' as const },
          data: stats.irradianceSeries,
        }]
        : []),
    ],
  };

  return (
    <div ref={slotRef} className={styles.slot}>
      <EChart
        className={styles.canvas}
        option={option}
        height={height}
        summary={`시간대별 발전량. 금일 합계 ${energyText(stats.dayKwh)}.`}
      />
    </div>
  );
}
