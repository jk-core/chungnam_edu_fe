import { useId, useState } from 'react';
import { EyeIcon, EyeOffIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import { describedBy, FormField, imeProps } from './FormField';
import styles from './Form.module.scss';
import type { FieldWidth, ImeMode } from './FormField';

interface BaseProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  ime?: ImeMode;
  width?: FieldWidth;
}

export function TextField({
  label,
  value,
  onChange,
  required,
  optional,
  hint,
  error,
  placeholder,
  disabled,
  readOnly,
  maxLength,
  ime = 'hangul',
  width = 'full',
}: BaseProps) {
  const id = useId();

  return (
    <FormField label={label} htmlFor={id} required={required} optional={optional} hint={hint} error={error}>
      <input
        id={id}
        type="text"
        className={cn(styles.control, styles[`width--${width}`])}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, hint, error)}
        {...imeProps(ime)}
      />
    </FormField>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  required,
  optional,
  hint,
  error,
  placeholder,
  disabled,
  readOnly,
  maxLength,
  ime = 'hangul',
}: BaseProps) {
  const id = useId();

  return (
    <FormField label={label} htmlFor={id} required={required} optional={optional} hint={hint} error={error}>
      <textarea
        id={id}
        className={cn(styles.control, styles['control--textarea'])}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, hint, error)}
        {...imeProps(ime)}
      />
    </FormField>
  );
}

interface NumberFieldProps extends Omit<BaseProps, 'value' | 'onChange' | 'ime'> {
  value: number | '';
  onChange: (value: number | '') => void;
  min?: number;
  max?: number;
  step?: number;
  /** 값 뒤에 붙는 단위 표기 */
  unit?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  required,
  optional,
  hint,
  error,
  placeholder,
  disabled,
  readOnly,
  min,
  max,
  step,
  unit,
  width = 'sm',
}: NumberFieldProps) {
  const id = useId();
  const suffix = unit ? `${hint ? `${hint} · ` : ''}단위 ${unit}` : hint;

  return (
    <FormField label={label} htmlFor={id} required={required} optional={optional} hint={suffix} error={error}>
      <input
        id={id}
        type="number"
        className={cn(styles.control, styles['control--number'], styles[`width--${width}`])}
        value={value}
        onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        min={min}
        max={max}
        step={step}
        inputMode="numeric"
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, suffix, error)}
      />
    </FormField>
  );
}

export function PasswordField({ label, value, onChange, required, hint, error, disabled, width = 'md' }: BaseProps) {
  const id = useId();
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <FormField label={label} htmlFor={id} required={required} hint={hint} error={error}>
      <span className={cn(styles.passwordWrap, styles[`width--${width}`])}>
        <input
          id={id}
          type={isRevealed ? 'text' : 'password'}
          className={styles.control}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          autoComplete="new-password"
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, hint, error)}
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
    </FormField>
  );
}
