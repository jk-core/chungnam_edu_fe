import { cn } from '@/utils/cn';
import styles from './Skeleton.module.scss';

interface SkeletonProps {
  height?: number | string;
  width?: number | string;
  radius?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

/** 내용이 준비되는 동안 자리를 지키는 회색 블록. */
export function Skeleton({ height = 20, width = '100%', radius = 'md', className }: SkeletonProps) {
  return (
    <span
      className={cn(styles.skeleton, styles[`skeleton--${radius}`], { [className ?? '']: !!className })}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
      }}
      aria-hidden="true"
    />
  );
}

/** 라우트 지연 로딩 중 보여 줄 기본 자리표시자 */
export function PageSkeleton() {
  return (
    <div className={styles.page}>
      <Skeleton height={44} width={220} />
      <Skeleton height={280} />
      <div className={styles.page__row}>
        <Skeleton height={132} />
        <Skeleton height={132} />
        <Skeleton height={132} />
      </div>
    </div>
  );
}
