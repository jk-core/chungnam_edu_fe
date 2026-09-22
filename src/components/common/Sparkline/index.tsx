import { lazy, Suspense } from 'react';
import type { SparklineProps } from './types';

// 첫 화면에서 쓰이므로 echarts 를 초기 번들에서 분리한다.
const SparklineChart = lazy(() => import('./SparklineChart'));

/** 값 배열을 얇은 추세선으로 그린다. 축·눈금 없이 형태만 전달하고, 폭은 담는 자리를 따른다. */
export function Sparkline({ height = 36, className, ...chart }: SparklineProps) {
  if (chart.values.length < 2) return null;

  return (
    <div className={className} style={{ height: `${height}px`, width: '100%' }} aria-hidden="true">
      <Suspense fallback={null}>
        <SparklineChart {...chart} />
      </Suspense>
    </div>
  );
}
