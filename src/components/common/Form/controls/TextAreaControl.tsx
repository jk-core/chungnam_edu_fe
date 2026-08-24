import { cn } from '@/utils/cn';
import styles from '../Form.module.scss';
import { imeProps } from './shared';
import type { ImeMode } from './shared';
import type { ComponentPropsWithoutRef } from 'react';

interface TextAreaControlProps extends Omit<ComponentPropsWithoutRef<'textarea'>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  ime?: ImeMode;
}

export function TextAreaControl({ value, onChange, ime = 'hangul', className, ...rest }: TextAreaControlProps) {
  return (
    <textarea
      {...rest}
      {...imeProps(ime)}
      className={cn(styles.control, styles['control--textarea'], { [className ?? '']: !!className })}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
