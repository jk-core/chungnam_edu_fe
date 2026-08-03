import { BarChart, LineChart } from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import ReactEChartsCore from 'echarts-for-react/esm/core';
import { useTheme } from '@/stores/themeStore';
import type { EChartsOption } from 'echarts';

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  MarkAreaComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

interface EChartProps {
  option: EChartsOption;
  height?: number | string;
  /** 차트를 대신할 텍스트 요약 — 스크린리더에 읽힌다. */
  summary: string;
  className?: string;
}

export function EChart({ option, height = 320, summary, className }: EChartProps) {
  const theme = useTheme();

  return (
    <figure className={className} style={{ margin: 0 }}>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
        // 테마가 바뀌면 색을 새로 계산해야 하므로 인스턴스를 다시 만든다.
        key={theme}
      />
      <figcaption
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clipPath: 'inset(50%)',
          whiteSpace: 'nowrap',
        }}
      >
        {summary}
      </figcaption>
    </figure>
  );
}
