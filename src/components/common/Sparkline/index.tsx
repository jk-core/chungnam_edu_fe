import { motion } from 'motion/react';

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  /** 선 색 CSS 변수명 */
  tone?: 'solar' | 'critical' | 'caution' | 'brand';
  /** 그려지는 연출. 여러 개가 한 화면에 늘어설 때는 꺼서 산만함을 줄인다. */
  animate?: boolean;
  /** 면을 채워 발전 곡선처럼 보이게 한다. */
  filled?: boolean;
  className?: string;
}

const TONE_COLOR: Record<NonNullable<SparklineProps['tone']>, string> = {
  solar: 'var(--solar)',
  critical: 'var(--critical)',
  caution: 'var(--caution)',
  brand: 'var(--brand)',
};

/** 값 배열을 얇은 추세선으로 그린다. 축·눈금 없이 형태만 전달한다. */
export function Sparkline({
  values,
  width = 132,
  height = 36,
  tone = 'brand',
  animate = true,
  filled = false,
  className,
}: SparklineProps) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values.map((value, index) => {
    const x = index * stepX;
    const y = height - ((value - min) / span) * (height - 4) - 2;

    return `${x},${y}`;
  });

  const color = TONE_COLOR[tone];
  const [lastX, lastY] = points[points.length - 1].split(',');

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      {filled ? (
        <polygon points={`0,${height} ${points.join(' ')} ${width},${height}`} fill={color} opacity="0.14" />
      ) : null}

      {animate ? (
        <motion.polyline
          points={points.join(' ')}
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      ) : (
        <polyline
          points={points.join(' ')}
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      <circle cx={lastX} cy={lastY} r="2.6" fill={color} />
    </svg>
  );
}
