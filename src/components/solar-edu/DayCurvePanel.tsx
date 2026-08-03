import { useEffect, useRef, useState } from 'react';
import { EChart } from '@/components/common/EChart';
import { LEGEND_GRID_TOP, topLegend } from '@/utils/chart';
import { formatNumber } from '@/utils/format';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { EduStats } from '@/mocks/solarEdu';
import styles from './SolarEdu.module.scss';
import type { EChartsOption } from 'echarts';

const AXIS_FONT = { fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' };

/** 좁은 화면에서도 축과 범례가 겹치지 않는 최소 높이 */
const MIN_CHART_HEIGHT = 150;

/** 곡선을 읽는 법 */
const NOTES = [
  {
    id: 'shape',
    term: '곡선은 해가 지나간 길을 닮았어요',
    body:
      '봉우리가 솟은 자리가 해가 가장 높이 뜬 시각이에요. 위 그림에서 해가 오르내리는 모양이 ' +
      '그대로 곡선이 되죠. 전기의 양을 정하는 건 설비가 아니라 햇빛이에요.',
  },
  {
    id: 'cloud',
    term: '두 선이 같이 내려가면 날씨 때문이에요',
    body:
      '움푹 팬 자리는 대개 구름이 지나간 자리예요. 두 선이 나란히 내려갔다면 날씨 탓이고, ' +
      '햇빛은 그대로인데 발전량만 떨어졌다면 먼지나 그늘, 고장을 살펴봐야 해요.',
  },
];

interface DayCurvePanelProps {
  stats: EduStats;
}

/**
 * 오늘 하루의 발전 곡선 (SFR-005-03).
 *
 * 막대를 세우면 값을 하나씩 읽게 되므로 채워진 곡선으로 그린다 — 하루의 모양이 먼저 보이고,
 * 곡선 아래 넓이가 곧 만든 양이 된다. 일사 곡선을 겹쳐, 발전량이 햇빛을 따라간다는 것도 함께 보인다.
 */
export function DayCurvePanel({ stats }: DayCurvePanelProps) {
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
    legend: topLegend(palette, ['발전량', '햇빛 세기']),
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
    yAxis: [
      { type: 'value', show: false },
      { type: 'value', show: false },
    ],
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
            position: 'end',
            rotate: 0,
            distance: 8,
            color: palette.caution,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Pretendard Variable, sans-serif',
          },
          data: [{ xAxis: nowIndex }],
        },
      },
      {
        name: '햇빛 세기',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'none',
        itemStyle: { color: palette.irradiance },
        lineStyle: { color: palette.irradiance, width: 2, type: 'dashed' },
        data: stats.irradianceSeries,
      },
    ],
  };

  return (
    <section className={styles.panel}>
      <p className={styles.panel__head}>
        그래서 오늘 이만큼 만들었어요
        <span className={styles.panel__note}>
          하루 모두 {formatNumber(stats.dayKwh)}kWh · 색이 칠해진 넓이가 만든 양이에요
        </span>
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
            summary={`시간대별 발전량과 햇빛 세기예요. 오늘 하루 모두 ${formatNumber(stats.dayKwh)}kWh 만들었어요.`}
          />
        </div>

        <div className={styles.split__notes}>
          {NOTES.map((note) => (
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
