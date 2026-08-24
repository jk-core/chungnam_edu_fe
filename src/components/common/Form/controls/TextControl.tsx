import { cn } from '@/utils/cn';
import { imeProps } from '@/utils/ime';
import type { ImeMode } from '@/utils/ime';
import styles from '../Form.module.scss';
import type { FieldWidth } from './shared';
import type { ComponentPropsWithoutRef } from 'react';

interface TextControlProps extends Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'onChange' | 'type'> {
  value: string;
  onChange: (value: string) => void;
  ime?: ImeMode;
  width?: FieldWidth;
}

export function TextControl({ value, onChange, ime = 'hangul', width = 'full', className, ...rest }: TextControlProps) {
  return (
    <input
      {...rest}
      {...imeProps(ime)}
      type="text"
      className={cn(styles.control, styles[`width--${width}`], className)}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
