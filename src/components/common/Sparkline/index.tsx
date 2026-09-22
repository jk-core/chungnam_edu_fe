import { lazy, Suspense } from 'react';
import type { SparklineProps } from './types';

/*
  추세선은 장식이라 늦게 떠도 화면이 읽힌다 — echarts 를 초기 묶음에서 떼어 둔다.
  홈 지도 팝업이 이 선을 쓰는데, 함께 묶으면 첫 화면이 차트 라이브러리 무게를 그대로 진다.
*/
const SparklineChart = lazy(() => import('./SparklineChart'));

/**
 * 값 배열을 얇은 추세선으로 그린다. 축·눈금 없이 형태만 전달한다.
 *
 * 폭은 담는 자리를 따른다 — 카드마다 너비가 달라 값으로 박아 두면 그 자리에서만 맞는다.
 */
export function Sparkline({ height = 36, className, ...chart }: SparklineProps) {
  // 점이 둘은 있어야 선이 된다.
  if (chart.values.length < 2) return null;

  return (
    <div className={className} style={{ height: `${height}px`, width: '100%' }} aria-hidden="true">
      <Suspense fallback={null}>
        <SparklineChart {...chart} />
      </Suspense>
    </div>
  );
}
