import { ChevronDownIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import styles from '../Form.module.scss';
import type { FieldWidth } from './shared';
import type { ComponentPropsWithoutRef } from 'react';

interface SelectControlProps<T extends string>
  extends Omit<ComponentPropsWithoutRef<'select'>, 'value' | 'onChange' | 'children'> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  width?: FieldWidth;
}

/**
 * 툴바의 `Select` 와 다른 컴포넌트다 — 거기는 알약, 여기는 옆 글자칸과 같은 상자다.
 * 하나에 「어디에 놓였는가」 분기를 두는 대신 자리마다 맞는 것을 쓴다.
 */
export function SelectControl<T extends string>({
  value,
  options,
  onChange,
  width = 'full',
  className,
  ...rest
}: SelectControlProps<T>) {
  return (
    <span className={cn(styles.selectWrap, styles[`width--${width}`], className)}>
      <select
        {...rest}
        className={cn(styles.control, styles['control--select'])}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className={styles.selectWrap__icon} />
    </span>
  );
}
