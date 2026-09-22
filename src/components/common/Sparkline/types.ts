export interface SparklineProps {
  /** 안 잰 자리는 null — 선이 그 자리에서 끊긴다. 0 으로 눕히면 없는 값이 바닥을 친 것으로 읽힌다 */
  values: (number | null)[];
  height?: number;
  /**
   * 선 색. `bands` 를 함께 주면 **기준 위 구간의 색**이다 — 아래 구간 색은 값이 정한다.
   */
  tone?: 'solar' | 'ok' | 'critical' | 'caution' | 'brand';
  /**
   * 값이 기준 아래로 내려가는 구간만 다른 색으로 그린다.
   * 주지 않으면 `tone` 한 색이다 — 기준이 없는 추세선은 색을 갈라 봐야 읽을 것이 없다.
   */
  bands?: { warn: number; critical: number };
  /** 그려지는 연출. 여러 개가 한 화면에 늘어설 때는 꺼서 산만함을 줄인다. */
  animate?: boolean;
  /** 면을 채워 발전 곡선처럼 보이게 한다. */
  filled?: boolean;
  className?: string;
}
