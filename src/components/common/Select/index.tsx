import { useId } from 'react';
import { ChevronDownIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import { describedBy, FormField } from '@/components/common/Form/FormField';
import styles from './Select.module.scss';

interface SelectProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  /** 라벨을 시각적으로 숨기고 스크린리더에만 남긴다. */
  hideLabel?: boolean;
  /**
   * 툴바 칩이 아니라 폼 칸으로 선다 — 옆 입력들과 같은 상자를 쓰고,
   * 라벨·필수 표시·도움말·오류도 다른 칸과 같은 껍데기(FormField)로 받는다.
   */
  asField?: boolean;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  hideLabel = false,
  asField = false,
  required,
  hint,
  error,
  className,
}: SelectProps<T>) {
  const id = useId();

  const control = (
    <div className={styles.select__control}>
      <select
        id={id}
        className={cn(styles.select__input, { [styles['select__input--field']]: asField })}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, hint, error)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className={styles.select__icon} />
    </div>
  );

  if (asField) {
    return (
      <FormField label={label} htmlFor={id} required={required} hint={hint} error={error}>
        {control}
      </FormField>
    );
  }

  return (
    <div className={cn(styles.select, { [className ?? '']: !!className })}>
      <label htmlFor={id} className={cn(styles.select__label, { [styles['select__label--hidden']]: hideLabel })}>
        {label}
      </label>
      {control}
    </div>
  );
}
