import { useId } from 'react';
import { ChevronDownIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import styles from './Select.module.scss';

interface SelectProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  /** 라벨을 시각적으로 숨기고 스크린리더에만 남긴다. */
  hideLabel?: boolean;
  className?: string;
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  hideLabel = false,
  className,
}: SelectProps<T>) {
  const id = useId();

  return (
    <div className={cn(styles.field, { [className ?? '']: !!className })}>
      <label htmlFor={id} className={cn(styles.field__label, { [styles['field__label--hidden']]: hideLabel })}>
        {label}
      </label>
      <div className={styles.field__control}>
        <select
          id={id}
          className={styles.field__select}
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className={styles.field__icon} />
      </div>
    </div>
  );
}
