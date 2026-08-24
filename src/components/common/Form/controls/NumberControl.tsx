import { cn } from '@/utils/cn';
import styles from '../Form.module.scss';
import type { FieldWidth } from './shared';
import type { ComponentPropsWithoutRef } from 'react';

interface NumberControlProps extends Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'onChange' | 'type'> {
  /** 빈 칸은 `''` 다 — 0 은 실제로 입력된 값이라 구분해야 한다 */
  value: number | '';
  onChange: (value: number | '') => void;
  width?: FieldWidth;
}

export function NumberControl({ value, onChange, width = 'full', className, ...rest }: NumberControlProps) {
  return (
    <input
      {...rest}
      type="number"
      inputMode="numeric"
      className={cn(styles.control, styles['control--number'], styles[`width--${width}`], className)}
      value={value}
      onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
    />
  );
}
