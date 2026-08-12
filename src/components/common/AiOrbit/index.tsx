import { cn } from '@/utils/cn';
import styles from './AiOrbit.module.scss';
import type { CSSProperties } from 'react';

interface AiOrbitProps {
  size?: number;
  /** 분석 중일 때 더 빠르게 돌고 후광이 맥동한다. */
  active?: boolean;
  className?: string;
}

/**
 * AI 분석을 상징하는 오빗 마크.
 * motion 대신 CSS 애니메이션을 쓴다 — rAF 는 문서가 가려지면 멈춰
 * 다시 돌아왔을 때 어정쩡한 프레임에 굳어 있기 때문이다.
 *
 * 관제 상황판과 교육용 대시보드가 함께 쓰므로 공용 자리에 둔다.
 */
export function AiOrbit({ size = 40, active = false, className }: AiOrbitProps) {
  return (
    <span
      className={cn(styles.orbit, {
        [styles['orbit--active']]: active,
        [className ?? '']: !!className,
      })}
      style={{ '--orbit-size': `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      <svg className={styles.orbit__svg} viewBox="0 0 64 64" role="presentation">
        <circle className={styles.orbit__halo} cx="32" cy="32" r="13" />
        <g className={styles.orbit__groupA}>
          <ellipse className={styles.orbit__ring} cx="32" cy="32" rx="28" ry="10" transform="rotate(22 32 32)" />
          <circle className={styles.orbit__dot} cx="58" cy="42" r="2.8" />
        </g>
        <g className={styles.orbit__groupB}>
          <ellipse className={styles.orbit__ring} cx="32" cy="32" rx="28" ry="10" transform="rotate(-58 32 32)" />
          <circle className={cn(styles.orbit__dot, styles['orbit__dot--solar'])} cx="47" cy="8" r="2.4" />
        </g>
        <circle className={styles.orbit__core} cx="32" cy="32" r="5.4" />
      </svg>
    </span>
  );
}
