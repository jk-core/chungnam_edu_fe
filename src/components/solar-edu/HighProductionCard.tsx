import { useEffect, useRef, useState } from 'react';
import { EChart } from '@/components/common/EChart';
import { energyText } from '@/mocks/eduContent';
import { useChartPalette } from '@/hooks/useChartPalette';
import type { EduStats } from '@/mocks/solarEdu';
import type { MiddleProductionContent } from '@/mocks/eduMiddle';
import { SunPathArt } from './SunPathArt';
import styles from './HighCards.module.scss';
import type { EChartsOption } from 'echarts';

const AXIS_FONT = { fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' };

/** 축과 곡선이 겹치지 않는 최소 높이 */
const MIN_CHART_HEIGHT = 118;

interface HighProductionCardProps {
  stats: EduStats;
  content: MiddleProductionContent;
}

/**
 * 오늘 얼마나 만들었나 (SFR-005-03/07).
 *
 * 고등 판은 발전 곡선에 일사 곡선을 겹쳐 둘 사이가 벌어지는지를 따진다. 여기서는 그 비교를 걷어 내고
 * 곡선 하나만 남긴 뒤, 그 옆에 해가 지나간 길을 나란히 세웠다. 두 그림의 모양이 닮았다는 것을 눈으로 잇는 것이
 * 이 나이에 필요한 전부다 — 발전량을 정하는 것은 설비가 아니라 햇빛이라는 이야기다.
 */
export function HighProductionCard({ stats, content }: HighProductionCardProps) {
  const palette = useChartPalette();
  const slotRef = useRef<HTMLDivElement>(null);
  // 화면 크기에 맞춰 차트를 늘린다 — echarts 는 퍼센트 높이를 못 받아 실측값을 넘긴다.
  const [chartHeight, setChartHeight] = useState(MIN_CHART_HEIGHT);
  const labels = stats.hourly.map((_, hour) => `${String(hour).padStart(2, '0')}시`);
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
    grid: { top: 16, right: 16, bottom: 26, left: 16 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      textStyle: { color: palette.text, fontSize: 12, fontFamily: 'Pretendard Variable, sans-serif' },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { color: palette.axis, interval: 2, ...AXIS_FONT },
    },
    // 세로 눈금은 두지 않는다 — 값을 하나씩 읽는 화면이 아니라 하루의 모양을 보는 화면이다.
    yAxis: [{ type: 'value', show: false }],
    series: [
      {
        name: '발전량',
        type: 'line',
        smooth: true,
        symbol: 'none',
        itemStyle: { color: palette.generation },
        lineStyle: { color: palette.generation, width: 3 },
        // 곡선 아래를 채워 "이만큼 만들었다" 는 양이 보이게 한다
        areaStyle: { color: palette.generationSoft, opacity: 0.5 },
        data: stats.hourly,
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: palette.caution, width: 2 },
          label: {
            show: true,
            formatter: '지금',
            /*
              격자 **안쪽** 위에 붙인다.
              바깥(`end`)에 두면 이름표가 격자 위로 8px 더 올라가는데, 위 여백이 16px 뿐이라
              글자 윗머리가 칸 밖으로 나가 잘린다. 여백을 늘리면 곡선이 그만큼 눌리므로
              이름표를 안으로 들이는 편이 낫다.
            */
            position: 'insideEndTop',
            distance: 4,
            color: palette.caution,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Pretendard Variable, sans-serif',
          },
          data: [{ xAxis: nowIndex }],
        },
      },
    ],
  };

  return (
    <section className={styles.card}>
      <p className={styles.card__head}>
        {content.head}
        <span className={styles.card__note}>{content.note(stats)}</span>
      </p>

      <div className={styles.production}>
        <div ref={slotRef} className={styles.production__chart}>
          <EChart
            className={styles.production__canvas}
            option={option}
            height={chartHeight}
            summary={`시간대별 발전량. 금일 합계 ${energyText(stats.dayKwh)}.`}
          />
        </div>

        {/* 곡선 옆에 해의 길을 나란히 둔다 — 두 모양이 닮았다는 것이 이 칸의 요점이다 */}
        <div className={styles.production__sun}>
          <SunPathArt nowHour={stats.nowHour} />
        </div>
      </div>

      <div className={styles.production__notes}>
        {content.notes.map((note) => (
          <div key={note.id} className={styles.note}>
            <p className={styles.note__term}>{note.term}</p>
            <p className={styles.note__body}>{note.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
