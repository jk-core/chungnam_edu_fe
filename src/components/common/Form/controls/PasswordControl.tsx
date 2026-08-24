import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import styles from '../Form.module.scss';
import type { FieldWidth } from './shared';
import type { ComponentPropsWithoutRef } from 'react';

interface PasswordControlProps extends Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'onChange' | 'type'> {
  value: string;
  onChange: (value: string) => void;
  width?: FieldWidth;
}

export function PasswordControl({ value, onChange, width = 'full', className, ...rest }: PasswordControlProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <span className={cn(styles.passwordWrap, styles[`width--${width}`], className)}>
      <input
        {...rest}
        type={isRevealed ? 'text' : 'password'}
        className={styles.control}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="new-password"
      />
      <button
        type="button"
        className={styles.passwordWrap__toggle}
        onClick={() => setIsRevealed((prev) => !prev)}
        aria-label={isRevealed ? '비밀번호 숨기기' : '비밀번호 보기'}
      >
        {isRevealed ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
      </button>
    </span>
  );
}
