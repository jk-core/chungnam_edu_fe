import { cn } from '@/utils/cn';
import styles from '../Form.module.scss';
import { imeProps } from './shared';
import type { FieldWidth, ImeMode } from './shared';
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
      className={cn(styles.control, styles[`width--${width}`], { [className ?? '']: !!className })}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
