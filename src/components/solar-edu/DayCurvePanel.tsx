import { useEffect, useRef, useState } from 'react';
import { EChart } from '@/components/common/EChart';
import { LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { useChartPalette } from '@/hooks/useChartPalette';
import { energyText } from '@/mocks/eduContent';
import type { DayContent } from '@/mocks/eduContent';
import type { EduStats } from '@/mocks/solarEdu';
import styles from './SolarEdu.module.scss';
import type { EChartsOption } from 'echarts';

const AXIS_FONT = { fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' };

/** 좁은 화면에서도 축과 범례가 겹치지 않는 최소 높이 */
const MIN_CHART_HEIGHT = 150;

interface DayCurvePanelProps {
  stats: EduStats;
  content: DayContent;
}

/**
 * 오늘 하루의 발전 곡선 (SFR-005-03).
 *
 * 막대를 세우면 값을 하나씩 읽게 되므로 채워진 곡선으로 그린다 — 하루의 모양이 먼저 보이고,
 * 곡선 아래 넓이가 곧 만든 양이 된다. 일사 곡선을 겹쳐, 발전량이 햇빛을 따라간다는 것도 함께 보인다.
 */
export function DayCurvePanel({ stats, content }: DayCurvePanelProps) {
  const palette = useChartPalette();
  const slotRef = useRef<HTMLDivElement>(null);
  // 화면 크기에 맞춰 차트를 늘린다 — echarts 는 퍼센트 높이를 못 받아 실측값을 넘긴다.
  const [chartHeight, setChartHeight] = useState(MIN_CHART_HEIGHT);
  const labels = stats.hourly.map((_, hour) => `${String(hour).padStart(2, '0')}시`);
  // 분 단위까지 살린 소수 인덱스. 카테고리 축도 소수를 받아 칸 사이에 선을 세워 준다.
  const nowIndex = Math.min(labels.length - 1, Math.max(0, stats.nowHour));

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
    // 세로 눈금이 없으니 좌우 여백을 걷어 곡선이 칸을 꽉 쓰게 한다.
    grid: { top: LEGEND_GRID_TOP, right: 16, bottom: 26, left: 16 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
    },
    legend: topLegend(palette, content.showIrradiance ? ['발전량', '일사량'] : ['발전량']),
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, interval: 2, ...AXIS_FONT },
    },
    // 세로 눈금은 두지 않는다 — 값을 하나씩 읽는 화면이 아니라 하루의 모양을 보는 화면이다.
    // 정확한 값이 필요하면 위쪽 고정 수치와 정보창에 있다.
    // 일사량을 끄면 보조축도 함께 지운다 — 남겨 두면 series 의 yAxisIndex 가 빈 축을 가리킨다.
    yAxis: content.showIrradiance
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
        // 곡선 아래를 채워 "이만큼 만들었다" 는 양이 보이게 한다
        areaStyle: { color: palette.generationSoft, opacity: 0.45 },
        data: stats.hourly,
        // 지금 이 순간 — 곡선 위에서 어디를 보면 되는지 한눈에 짚이도록 진한 주황 실선으로 세운다
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: palette.caution, width: 2 },
          label: {
            show: true,
            formatter: '지금',
            /*
              격자 **안쪽** 위에 붙인다.
              바깥(`end`)에 두면 이름표가 격자 위로 올라가 범례와 자리를 다투고, 위 여백이 좁은
              칸에서는 글자 윗머리가 잘린다. 여백을 늘리면 곡선이 그만큼 눌린다.
            */
            position: 'insideEndTop',
            rotate: 0,
            distance: 4,
            color: palette.caution,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Pretendard Variable, sans-serif',
          },
          data: [{ xAxis: nowIndex }],
        },
      },
      ...(content.showIrradiance
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
    <section className={styles.panel}>
      <p className={styles.panel__head}>
        {content.head}
        <span className={styles.panel__note}>{content.note(stats)}</span>
      </p>

      <div className={styles.split}>
        <div
          ref={slotRef}
          className={styles.split__chart}
        >
          <EChart
            className={styles.split__canvas}
            option={option}
            height={chartHeight}
            summary={`시간대별 발전량과 일사량. 금일 합계 ${energyText(stats.dayKwh)}.`}
          />
        </div>

        <div className={styles.split__notes}>
          {content.notes.map((note) => (
            <div key={note.id} className={styles.note}>
              <p className={styles.note__term}>{note.term}</p>
              <p className={styles.note__body}>{note.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
