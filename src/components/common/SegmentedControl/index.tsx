import { useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/utils/cn';
import styles from './SegmentedControl.module.scss';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 스크린리더용 그룹 이름 */
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** 활성 인디케이터가 선택지 사이를 미끄러지듯 이동하는 세그먼트 컨트롤. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  const layoutId = useId();

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(styles.segmented, styles[`segmented--${size}`], { [className ?? '']: !!className })}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            className={cn(styles.segmented__item, { [styles['segmented__item--active']]: isActive })}
            onClick={() => onChange(option.value)}
          >
            {isActive ? (
              <motion.span
                layoutId={layoutId}
                className={styles.segmented__indicator}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className={styles.segmented__label}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
