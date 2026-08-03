import { useEffect, useRef, useState } from 'react';
import { useCountUp } from '@/hooks/useCountUp';
import { formatNumber } from '@/utils/format';

interface CountUpProps {
  value: number;
  fractionDigits?: number;
  duration?: number;
  /** 뷰포트에 들어온 뒤 세기 시작한다. */
  startOnView?: boolean;
  className?: string;
}

/** 목표 수치까지 굴러 올라가는 숫자. tabular-nums 는 호출부 타이포 믹스인이 담당한다. */
export function CountUp({
  value,
  fractionDigits = 0,
  duration = 1200,
  startOnView = true,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(!startOnView);
  const displayed = useCountUp(value, { duration, enabled: started });

  useEffect(() => {
    if (started || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [started]);

  return (
    <span ref={ref} className={className}>
      {formatNumber(displayed, fractionDigits)}
    </span>
  );
}
